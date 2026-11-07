# Nested Form dirty-stream runtime gate

This experiment is intentionally isolated from the production branch.

## Required runtime proof

The `nested-form-runtime-prototype` GitHub Actions job must:

1. Check out the exact pinned EmbedPDF PDFium runtime revision.
2. Apply `patches/pdfium/nested-form-dirty-stream-api.patch` without conflicts.
3. Build the Emscripten/WASM static library.
4. Confirm that `FPDFFormObj_MarkObjectDirty` is defined in the compiled library.
5. Link and execute `tests/pdfium/nested-form-dirty-api-wasm-smoke.c`.
6. Verify that the nested replacement survives Save/Reopen, the original text is absent, the replacement is visible after rendering, and the unrelated page-level control remains unchanged.

## Release gate

A source-level patch or a successful native-only test is not sufficient. Native text replacement must remain disabled until the compiled WASM job passes all of the checks above. A failed, missing, cancelled, or unreported workflow run is not a pass.

General Form XObject editing remains disabled. The current fixtures prove only their explicitly tested synthetic cases; they do not establish correctness for arbitrary PDF files, clipping paths, resource dictionaries, or transformed nested Forms.

## Production boundary

No production branch, deployed bundle, or public editor capability is changed by this experiment.
