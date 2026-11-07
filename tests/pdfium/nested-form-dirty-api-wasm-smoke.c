#include <stdarg.h>
#include <stdio.h>
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
  const char* page_content = "q /Outer Do Q";
  const char* outer_content = "q /Inner Do Q";
  const char* inner_content = "BT /F1 12 Tf 10 100 Td (ORIGINAL) Tj ET";

  if (!appendf(buffer, "%%PDF-1.7\n")) return 0;
  if (!append_object(buffer, offsets, 1,
      "<< /Type /Catalog /Pages 2 0 R >>")) return 0;
  if (!append_object(buffer, offsets, 2,
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")) return 0;
  if (!append_object(buffer, offsets, 3,
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] "
      "/Resources << /XObject << /Outer 4 0 R >> >> /Contents 7 0 R >>"))
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

int main(void) {
  PdfBuffer input = {{0}, 0};
  if (!build_nested_form_pdf(&input)) return 1;

  FPDF_InitLibrary();
  FPDF_DOCUMENT document =
      FPDF_LoadMemDocument64(input.bytes, (unsigned long long)input.size, NULL);
  if (!document) return 2;

  FPDF_PAGE page = FPDF_LoadPage(document, 0);
  if (!page) {
    FPDF_CloseDocument(document);
    return 3;
  }

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
  FPDFText_ClosePage(text_page);
  FPDF_ClosePage(reopened_page);
  FPDF_CloseDocument(reopened);
  FPDF_DestroyLibrary();

  if (!replacement_found || original_remains) return 15;
  return 0;
}
