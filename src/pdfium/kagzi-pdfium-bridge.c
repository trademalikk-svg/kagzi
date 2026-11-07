#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "public/fpdf_edit.h"
#include "public/fpdf_save.h"
#include "public/fpdf_text.h"
#include "public/fpdfview.h"

#define KAGZI_MAX_FORM_DEPTH 64

typedef struct {
  FPDF_FILEWRITE base;
  unsigned char* data;
  size_t size;
  size_t capacity;
  int failed;
} KagziSaveBuffer;

static int kagzi_save_block(FPDF_FILEWRITE* writer,
                            const void* data,
                            unsigned long size) {
  KagziSaveBuffer* buffer = (KagziSaveBuffer*)writer;
  if (buffer->failed || size > SIZE_MAX - buffer->size) {
    buffer->failed = 1;
    return 0;
  }
  size_t needed = buffer->size + (size_t)size;
  if (needed > buffer->capacity) {
    size_t capacity = buffer->capacity ? buffer->capacity : 4096;
    while (capacity < needed) {
      if (capacity > SIZE_MAX / 2) {
        capacity = needed;
        break;
      }
      capacity *= 2;
    }
    unsigned char* grown = (unsigned char*)realloc(buffer->data, capacity);
    if (!grown) {
      buffer->failed = 1;
      return 0;
    }
    buffer->data = grown;
    buffer->capacity = capacity;
  }
  memcpy(buffer->data + buffer->size, data, (size_t)size);
  buffer->size = needed;
  return 1;
}

static int kagzi_matches_at(FPDF_TEXTPAGE text_page,
                            int start,
                            const uint32_t* target,
                            uint32_t target_length,
                            FPDF_PAGEOBJECT* matched_object) {
  FPDF_PAGEOBJECT object = FPDFText_GetTextObject(text_page, start);
  if (!object || FPDFPageObj_GetType(object) != FPDF_PAGEOBJ_TEXT) {
    return 0;
  }
  for (uint32_t i = 0; i < target_length; ++i) {
    if (FPDFText_GetUnicode(text_page, start + (int)i) != target[i] ||
        FPDFText_GetTextObject(text_page, start + (int)i) != object) {
      return 0;
    }
  }

  // FPDFText_SetText replaces the complete text object. Refuse a substring
  // match if other extracted characters belong to the same object.
  const int count = FPDFText_CountChars(text_page);
  for (int i = 0; i < count; ++i) {
    if (FPDFText_GetTextObject(text_page, i) == object &&
        (i < start || i >= start + (int)target_length)) {
      return 0;
    }
  }
  *matched_object = object;
  return 1;
}

static int kagzi_find_in_form(FPDF_PAGEOBJECT form,
                              FPDF_PAGEOBJECT target,
                              FPDF_PAGEOBJECT* parents,
                              int depth,
                              int* found_depth) {
  if (depth > KAGZI_MAX_FORM_DEPTH) {
    return 0;
  }
  const int count = FPDFFormObj_CountObjects(form);
  if (count < 0) {
    return 0;
  }
  for (int i = 0; i < count; ++i) {
    FPDF_PAGEOBJECT child = FPDFFormObj_GetObject(form, (unsigned long)i);
    if (!child) {
      return 0;
    }
    if (child == target) {
      *found_depth = depth;
      return 1;
    }
    if (FPDFPageObj_GetType(child) == FPDF_PAGEOBJ_FORM) {
      parents[depth] = child;
      if (kagzi_find_in_form(child, target, parents, depth + 1,
                             found_depth)) {
        return 1;
      }
    }
  }
  return 0;
}

static int kagzi_find_owner_path(FPDF_PAGE page,
                                 FPDF_PAGEOBJECT target,
                                 FPDF_PAGEOBJECT* parents,
                                 int* found_depth) {
  const int count = FPDFPage_CountObjects(page);
  for (int i = 0; i < count; ++i) {
    FPDF_PAGEOBJECT object = FPDFPage_GetObject(page, i);
    if (!object) {
      return 0;
    }
    if (object == target) {
      *found_depth = 0;
      return 1;
    }
    if (FPDFPageObj_GetType(object) == FPDF_PAGEOBJ_FORM) {
      parents[0] = object;
      if (kagzi_find_in_form(object, target, parents, 1, found_depth)) {
        return 1;
      }
    }
  }
  return 0;
}

static int kagzi_utf32_to_utf16(const uint32_t* input,
                                uint32_t length,
                                unsigned short** output,
                                size_t* output_length) {
  if (!input || !length || !output || !output_length) {
    return 0;
  }
  if ((size_t)length > SIZE_MAX / (2 * sizeof(unsigned short)) - 1) {
    return 0;
  }
  unsigned short* converted =
      (unsigned short*)malloc(((size_t)length * 2 + 1) * sizeof(unsigned short));
  if (!converted) {
    return 0;
  }
  size_t used = 0;
  for (uint32_t i = 0; i < length; ++i) {
    uint32_t codepoint = input[i];
    if (codepoint > 0x10FFFF ||
        (codepoint >= 0xD800 && codepoint <= 0xDFFF)) {
      free(converted);
      return 0;
    }
    if (codepoint <= 0xFFFF) {
      converted[used++] = (unsigned short)codepoint;
    } else {
      codepoint -= 0x10000;
      converted[used++] = (unsigned short)(0xD800 + (codepoint >> 10));
      converted[used++] = (unsigned short)(0xDC00 + (codepoint & 0x3FF));
    }
  }
  converted[used] = 0;
  *output = converted;
  *output_length = used;
  return 1;
}

/*
 * Returns 0 on success. Negative codes are fail-closed classifications:
 * -1 invalid arguments, -2 PDF load failed, -3 page unavailable,
 * -4 exact text object not found, -5 ambiguous target, -6 owner path invalid,
 * -7 replacement rejected, -8 Form dirty propagation failed,
 * -9 page content generation failed, -10 PDF save failed.
 *
 * target/replacement are Unicode scalar arrays (UTF-32 code points).
 * The function only edits a complete, uniquely matched PDF text object.
 */
int kagzi_pdf_replace_text(const unsigned char* pdf_bytes,
                           uint32_t pdf_size,
                           int page_index,
                           const uint32_t* target,
                           uint32_t target_length,
                           const uint32_t* replacement,
                           uint32_t replacement_length,
                           unsigned char** output_bytes,
                           uint32_t* output_size) {
  if (!pdf_bytes || !pdf_size || page_index < 0 || !target || !target_length ||
      !replacement || !replacement_length || !output_bytes || !output_size) {
    return -1;
  }
  *output_bytes = NULL;
  *output_size = 0;

  unsigned short* replacement_utf16 = NULL;
  size_t replacement_utf16_length = 0;
  if (!kagzi_utf32_to_utf16(replacement, replacement_length,
                            &replacement_utf16,
                            &replacement_utf16_length)) {
    return -1;
  }
  (void)replacement_utf16_length;

  FPDF_InitLibrary();
  FPDF_DOCUMENT document =
      FPDF_LoadMemDocument64(pdf_bytes, (unsigned long long)pdf_size, NULL);
  if (!document) {
    free(replacement_utf16);
    FPDF_DestroyLibrary();
    return -2;
  }

  if (page_index >= FPDF_GetPageCount(document)) {
    FPDF_CloseDocument(document);
    free(replacement_utf16);
    FPDF_DestroyLibrary();
    return -3;
  }

  FPDF_PAGE page = FPDF_LoadPage(document, page_index);
  if (!page) {
    FPDF_CloseDocument(document);
    free(replacement_utf16);
    FPDF_DestroyLibrary();
    return -3;
  }

  FPDF_TEXTPAGE text_page = FPDFText_LoadPage(page);
  if (!text_page) {
    FPDF_ClosePage(page);
    FPDF_CloseDocument(document);
    free(replacement_utf16);
    FPDF_DestroyLibrary();
    return -4;
  }

  FPDF_PAGEOBJECT target_object = NULL;
  int matches = 0;
  const int char_count = FPDFText_CountChars(text_page);
  for (int i = 0; i + (int)target_length <= char_count; ++i) {
    FPDF_PAGEOBJECT candidate = NULL;
    if (kagzi_matches_at(text_page, i, target, target_length, &candidate)) {
      target_object = candidate;
      ++matches;
    }
  }
  FPDFText_ClosePage(text_page);

  if (matches != 1 || !target_object) {
    FPDF_ClosePage(page);
    FPDF_CloseDocument(document);
    free(replacement_utf16);
    FPDF_DestroyLibrary();
    return matches > 1 ? -5 : -4;
  }

  FPDF_PAGEOBJECT parents[KAGZI_MAX_FORM_DEPTH + 1] = {0};
  int form_depth = 0;
  if (!kagzi_find_owner_path(page, target_object, parents, &form_depth)) {
    FPDF_ClosePage(page);
    FPDF_CloseDocument(document);
    free(replacement_utf16);
    FPDF_DestroyLibrary();
    return -6;
  }

  if (!FPDFText_SetText(target_object, replacement_utf16)) {
    FPDF_ClosePage(page);
    FPDF_CloseDocument(document);
    free(replacement_utf16);
    FPDF_DestroyLibrary();
    return -7;
  }
  free(replacement_utf16);

  // Dirty the innermost Form stream first, then each ancestor Form stream.
  for (int i = form_depth - 1; i >= 0; --i) {
    FPDF_PAGEOBJECT direct_child =
        (i == form_depth - 1) ? target_object : parents[i + 1];
    if (!FPDFFormObj_MarkObjectDirty(parents[i], direct_child)) {
      FPDF_ClosePage(page);
      FPDF_CloseDocument(document);
      FPDF_DestroyLibrary();
      return -8;
    }
  }

  if (!FPDFPage_GenerateContent(page)) {
    FPDF_ClosePage(page);
    FPDF_CloseDocument(document);
    FPDF_DestroyLibrary();
    return -9;
  }

  KagziSaveBuffer save = {{1, kagzi_save_block}, NULL, 0, 0, 0};
  const FPDF_BOOL saved =
      FPDF_SaveAsCopy(document, &save.base, FPDF_NO_INCREMENTAL);
  FPDF_ClosePage(page);
  FPDF_CloseDocument(document);
  FPDF_DestroyLibrary();

  if (!saved || save.failed || !save.data || !save.size ||
      save.size > UINT32_MAX) {
    free(save.data);
    return -10;
  }
  *output_bytes = save.data;
  *output_size = (uint32_t)save.size;
  return 0;
}

void kagzi_pdf_free(unsigned char* bytes) {
  free(bytes);
}
