# KAGZI PDFium native text editing — verification record

## Runtime provenance

- Upstream: `embedpdf/runtime` pinned to `42388d3b4c9895d6672f5da357b1429678a0994c`.
- Emscripten: `3.1.72`.
- The nested Form dirty-stream API is carried as a small, reviewed patch in `patches/pdfium/nested-form-dirty-stream-api.patch`.
- The browser runtime is generated as `assets/kagzi-pdfium-native.js` and `assets/kagzi-pdfium-native.wasm`; the publisher workflow verifies SHA-256 before updating the assets.
- PDFium/CloudPDF license, NOTICE, and explicit third-party license texts are bundled in `assets/kagzi-pdfium-LICENSE.txt`, `assets/kagzi-pdfium-NOTICE.txt`, and `assets/kagzi-pdfium-THIRD-PARTY-NOTICES.txt`, and linked from the editor.

## Verified behavior

The PDFium build, patched rebuild, C/WASM nested Form Save/Reopen smoke test, and Chromium browser integration test passed in workflow run `42485673940` on the native-text feature PR.

The browser test uses a two-page PDF containing nested Form XObjects and verifies:

- The unique source string `ORIGINAL` is replaced by `REPLACED`.
- The edited PDF is reopened and the old string is absent.
- The page control text remains present.
- The second page remains intact.
- The exported PDF can be reopened and retains the replacement and both pages.
- The Inspector's text preview updates before applying the native edit.

A PDF.js worker-buffer ownership defect was found by this browser test and fixed by passing a copy of the PDF bytes to PDF.js, preserving the editor's own working buffer.

## Scope and limitations

- Native source replacement is fail-closed: it requires one exact, unique PDF.js text match and successful Save/Reopen verification.
- Native replacement changes text content while preserving the original PDF font/style. Font size, colour, opacity, alignment and bold styling are applied through the separate visual overlay tool.
- Scanned/image-only text, outlined glyphs, duplicate/partial matches, unsupported encodings, encrypted documents, and arbitrary complex PDF structures are not claimed to be editable by this native path.
- A passing synthetic fixture is not a universal PDF compatibility guarantee. Keep the overlay route available as a fallback.
- PDF processing remains local in the browser; no paid API or server upload is required.
