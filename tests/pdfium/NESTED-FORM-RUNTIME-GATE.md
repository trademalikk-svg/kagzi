# Nested Form PDFium runtime gate

This code is experimental and isolated on `feature/pdfium-native-text-integration`.

## Proven in run #199

The pinned EmbedPDF PDFium runtime at `42388d3b4c9895d6672f5da357b1429678a0994c` was built with Emscripten 3.1.72 after applying the experimental dirty-stream patch. The patch rebuilt successfully, the API was resolved by a WASM link, and the synthetic nested Form fixture passed Save/Reopen with `ORIGINAL` absent, `REPLACED` present, and `PAGECONTROL` preserved. The browser-facing C bridge was also exercised in the WASM smoke executable.

## Remaining browser gates

- Produce and inspect a browser-loadable module (not just the smoke executable).
- Review license and bundled third-party notices before redistributing the WASM binary.
- Integrate a fail-closed JavaScript adapter and test real browser memory handling.
- Verify browser Save/Reopen and rendered pixels using downloaded output on Chromium desktop and mobile.
- Expand fixture coverage before enabling general Form editing.

Native editing must remain disabled until all browser gates pass. Synthetic fixture success is not a universal PDF compatibility claim. Production `main` and Cloudflare Pages deployment must remain unchanged.
