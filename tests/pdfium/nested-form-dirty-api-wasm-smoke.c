#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "public/fpdf_edit.h"
#include "public/fpdf_save.h"
#include "public/fpdf_text.h"

#define PDF_CAPACITY 8192
#define OUTPUT_CAPACITY 16384

typedef struct {
  char bytes[PDF_CAPACITY];
  size_t size;
} PdfBuffer;

typedef struct {
  FPDF_FILEWRITE base;
  unsigned char bytes[OUTPUT_CAPACITY];
  size_t size;
} SaveBuffer;

static int appendf(PdfBuffer* buffer, const char* format, ...) {
  va_list args;
  va_start(args, format);
  int written = vsnprintf(buffer->bytes + buffer->size,
                          sizeof(buffer->bytes) - buffer->size, format, args);
  va_end(args);
  if (written < 0 || (size_t)written >= sizeof(buffer->bytes) - buffer->size)
    return 0;
  buffer->size += (size_t)written;
  return 1;
}

static int append_object(PdfBuffer* buffer, size_t offsets[], int number,
                         const char* body) {
  offsets[number] = buffer->size;
  return appendf(buffer, "%d 0 obj\n%s\nendobj\n", number, body);
}

static int build_nested_form_pdf(PdfBuffer* buffer) {
  size_t offsets[8] = {0};
  const char* page_content = "BT /F1 9 Tf 10 10 Td (PAGECONTROL) Tj ET q /Outer Do Q";
  const char* outer_content = "q /Inner Do Q";
  const char* inner_content = "BT /F1 12 Tf 10 100 Td (ORIGINAL) Tj ET";

  if (!appendf(buffer, "%%PDF-1.7\n")) return 0;
  if (!append_object(buffer, offsets, 1,
      "<< /Type /Catalog /Pages 2 0 R >>")) return 0;
  if (!append_object(buffer, offsets, 2,
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")) return 0;
  if (!append_object(buffer, offsets, 3,
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] "
      "/Resources << /Font << /F1 6 0 R >> /XObject << /Outer 4 0 R >> >> "
      "/Contents 7 0 R >>"))
    return 0;

  char stream_body[1024];
  snprintf(stream_body, sizeof(stream_body),
      "<< /Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 300 300] "
      "/Resources << /XObject << /Inner 5 0 R >> >> /Length %zu >>\n"
      "stream\n%s\nendstream", strlen(outer_content), outer_content);
  if (!append_object(buffer, offsets, 4, stream_body)) return 0;

  snprintf(stream_body, sizeof(stream_body),
      "<< /Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 300 300] "
      "/Resources << /Font << /F1 6 0 R >> >> /Length %zu >>\n"
      "stream\n%s\nendstream", strlen(inner_content), inner_content);
  if (!append_object(buffer, offsets, 5, stream_body)) return 0;
  if (!append_object(buffer, offsets, 6,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")) return 0;

  snprintf(stream_body, sizeof(stream_body),
      "<< /Length %zu >>\nstream\n%s\nendstream",
      strlen(page_content), page_content);
  if (!append_object(buffer, offsets, 7, stream_body)) return 0;

  size_t xref_offset = buffer->size;
  if (!appendf(buffer, "xref\n0 8\n0000000000 65535 f \n")) return 0;
  for (int i = 1; i <= 7; ++i) {
    if (!appendf(buffer, "%010zu 00000 n \n", offsets[i])) return 0;
  }
  return appendf(buffer,
      "trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n%zu\n%%%%EOF\n",
      xref_offset);
}

static int save_block(FPDF_FILEWRITE* writer, const void* data,
                      unsigned long size) {
  SaveBuffer* output = (SaveBuffer*)writer;
  if (size > OUTPUT_CAPACITY - output->size) return 0;
  memcpy(output->bytes + output->size, data, size);
  output->size += size;
  return 1;
}

static int contains_text(FPDF_TEXTPAGE text_page, const char* expected) {
  size_t expected_length = strlen(expected);
  int count = FPDFText_CountChars(text_page);
  for (int start = 0; start + (int)expected_length <= count; ++start) {
    size_t matched = 0;
    while (matched < expected_length &&
           FPDFText_GetUnicode(text_page, start + (int)matched) ==
               (unsigned char)expected[matched]) {
      ++matched;
    }
    if (matched == expected_length) return 1;
  }
  return 0;
}

#define RENDER_WIDTH 600
#define RENDER_HEIGHT 600

static FPDF_BITMAP render_page(FPDF_PAGE page) {
  FPDF_BITMAP bitmap = FPDFBitmap_Create(RENDER_WIDTH, RENDER_HEIGHT, 0);
  if (!bitmap) return NULL;
  if (!FPDFBitmap_FillRect(bitmap, 0, 0, RENDER_WIDTH, RENDER_HEIGHT,
                           0xFFFFFFFF)) {
    FPDFBitmap_Destroy(bitmap);
    return NULL;
  }
  FPDF_RenderPageBitmap(bitmap, page, 0, 0, RENDER_WIDTH, RENDER_HEIGHT, 0, 0);
  return bitmap;
}

static int count_region_differences(const unsigned char* before,
                                    const unsigned char* after, int stride,
                                    int left, int top, int right, int bottom) {
  int differences = 0;
  for (int y = top; y < bottom; ++y) {
    for (int x = left; x < right; ++x) {
      if (memcmp(before + y * stride + x * 4,
                 after + y * stride + x * 4, 4) != 0) {
        ++differences;
      }
    }
  }
  return differences;
}

int main(void) {
  PdfBuffer input = {{0}, 0};
  if (!build_nested_form_pdf(&input)) return 1;

  FPDF_InitLibrary();
  if (FPDFFormObj_MarkObjectDirty(NULL, NULL)) return 16;
  FPDF_DOCUMENT document =
      FPDF_LoadMemDocument64(input.bytes, (unsigned long long)input.size, NULL);
  if (!document) return 2;

  FPDF_PAGE page = FPDF_LoadPage(document, 0);
  if (!page) {
    FPDF_CloseDocument(document);
    return 3;
  }

  // Prove the fixture contains both nested target text and the unrelated
  // page-level control before mutating anything.
  FPDF_TEXTPAGE original_text_page = FPDFText_LoadPage(page);
  if (!original_text_page) {
    FPDF_ClosePage(page);
    FPDF_CloseDocument(document);
    return 17;
  }
  int original_found = contains_text(original_text_page, "ORIGINAL");
  int initial_control_found = contains_text(original_text_page, "PAGECONTROL");
  FPDFText_ClosePage(original_text_page);
  if (!original_found || !initial_control_found) {
    FPDF_ClosePage(page);
    FPDF_CloseDocument(document);
    return 18;
  }

  // Capture the original page pixels so the round-trip test verifies visible
  // output as well as extracted text.
  FPDF_BITMAP before_bitmap = render_page(page);
  if (!before_bitmap) return 19;
  int before_stride = FPDFBitmap_GetStride(before_bitmap);
  size_t before_size = (size_t)before_stride * RENDER_HEIGHT;
  unsigned char* before_pixels = (unsigned char*)malloc(before_size);
  if (!before_pixels) return 20;
  memcpy(before_pixels, FPDFBitmap_GetBuffer(before_bitmap), before_size);
  FPDFBitmap_Destroy(before_bitmap);

  FPDF_PAGEOBJECT outer_form = NULL;
  for (int i = 0; i < FPDFPage_CountObjects(page); ++i) {
    FPDF_PAGEOBJECT object = FPDFPage_GetObject(page, i);
    if (FPDFPageObj_GetType(object) == FPDF_PAGEOBJ_FORM) {
      outer_form = object;
      break;
    }
  }
  if (!outer_form || FPDFFormObj_CountObjects(outer_form) != 1) return 4;

  FPDF_PAGEOBJECT inner_form = FPDFFormObj_GetObject(outer_form, 0);
  if (!inner_form || FPDFPageObj_GetType(inner_form) != FPDF_PAGEOBJ_FORM ||
      FPDFFormObj_CountObjects(inner_form) != 1) return 5;

  FPDF_PAGEOBJECT text_object = FPDFFormObj_GetObject(inner_form, 0);
  if (!text_object || FPDFPageObj_GetType(text_object) != FPDF_PAGEOBJ_TEXT)
    return 6;

  // The API must reject objects that are not direct children of the supplied
  // Form. Otherwise callers could mark the wrong content stream dirty.
  if (FPDFFormObj_MarkObjectDirty(outer_form, text_object)) return 25;
  if (FPDFFormObj_MarkObjectDirty(inner_form, outer_form)) return 26;

  const unsigned short replacement[] = {
      'R', 'E', 'P', 'L', 'A', 'C', 'E', 'D', 0
  };
  if (!FPDFText_SetText(text_object, replacement)) return 7;

  // Dirty the innermost stream first, then propagate dirtiness through every
  // ancestor Form so ProcessForm() regenerates the complete nested chain.
  if (!FPDFFormObj_MarkObjectDirty(inner_form, text_object)) return 8;
  if (!FPDFFormObj_MarkObjectDirty(outer_form, inner_form)) return 9;
  if (!FPDFPage_GenerateContent(page)) return 10;

  SaveBuffer saved = {{0}, 0};
  saved.base.version = 1;
  saved.base.WriteBlock = save_block;
  if (!FPDF_SaveAsCopy(document, &saved.base, FPDF_NO_INCREMENTAL)) return 11;
  FPDF_ClosePage(page);
  FPDF_CloseDocument(document);

  FPDF_DOCUMENT reopened = FPDF_LoadMemDocument64(
      saved.bytes, (unsigned long long)saved.size, NULL);
  if (!reopened) return 12;
  FPDF_PAGE reopened_page = FPDF_LoadPage(reopened, 0);
  if (!reopened_page) {
    FPDF_CloseDocument(reopened);
    return 13;
  }
  FPDF_TEXTPAGE text_page = FPDFText_LoadPage(reopened_page);
  if (!text_page) return 14;

  int replacement_found = contains_text(text_page, "REPLACED");
  int original_remains = contains_text(text_page, "ORIGINAL");
  int control_preserved = contains_text(text_page, "PAGECONTROL");
  FPDFText_ClosePage(text_page);

  FPDF_BITMAP after_bitmap = render_page(reopened_page);
  if (!after_bitmap) return 21;
  int after_stride = FPDFBitmap_GetStride(after_bitmap);
  const unsigned char* after_pixels =
      (const unsigned char*)FPDFBitmap_GetBuffer(after_bitmap);
  if (after_stride != before_stride) return 22;

  // The nested target occupies the middle of the page; the page-level
  // control is near the bottom. The target must visibly change while the
  // unrelated control region remains pixel-identical.
  int target_pixel_differences = count_region_differences(
      before_pixels, after_pixels, before_stride, 0, 340, 300, 440);
  int control_pixel_differences = count_region_differences(
      before_pixels, after_pixels, before_stride, 0, 550, 300, 600);

  FPDFBitmap_Destroy(after_bitmap);
  free(before_pixels);
  FPDF_ClosePage(reopened_page);
  FPDF_CloseDocument(reopened);
  FPDF_DestroyLibrary();

  if (!replacement_found || original_remains || !control_preserved) return 15;
  if (target_pixel_differences == 0) return 23;
  if (control_pixel_differences != 0) return 24;
  return 0;
}
