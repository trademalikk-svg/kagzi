#include "public/fpdf_edit.h"

int main(void) {
  // Invalid handles must fail closed. This also forces the new public API
  // into the final WASM link, rather than merely proving it exists in an
  // intermediate static archive.
  return FPDFFormObj_MarkObjectDirty(NULL, NULL) ? 1 : 0;
}
