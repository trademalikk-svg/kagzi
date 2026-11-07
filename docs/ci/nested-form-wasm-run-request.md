# Nested Form WASM runtime verification

This documentation-only commit requests the existing `PDFcanvas isolated dependency spike` workflow to run on `experiment/pdfcanvas-poc`.

Release gate remains unchanged: do not enable native nested Form text replacement or merge this experiment into production unless the compiled PDFium WASM API links and the Save/Reopen smoke test proves that `ORIGINAL` is absent, `REPLACED` is present, and `PAGECONTROL` is preserved.
