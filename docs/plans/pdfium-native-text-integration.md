# KAGZI PDFium native text integration — staged rollout

**Status:** Integration branch only; native replacement remains disabled in the public editor.

## Evidence carried forward

GitHub Actions run #199 on `experiment/pdfcanvas-poc` completed successfully on 2026-11-08:
- pinned PDFium baseline WASM build passed;
- experimental nested-Form dirty-stream API patch applied and rebuilt;
- the patched API resolved during an Emscripten WASM link;
- the synthetic nested Form Save/Reopen fixture passed: `ORIGINAL` absent, `REPLACED` present, and `PAGECONTROL` preserved;
- the C bridge smoke test also passed.

This proves the tested synthetic fixture and pinned runtime build. It does not establish compatibility with arbitrary customer PDFs or a deployable browser bundle.

## Integration branch

Work is isolated on `feature/pdfium-native-text-integration`, based on `main`. Do not merge the divergent `experiment/pdfcanvas-poc` branch wholesale.

## Required stages

1. **Vendor the exact experimental patch and C bridge** on this branch, with pinned runtime revision and source provenance.
2. **Build a browser-loadable Emscripten module** from the patched static PDFium library and bridge. The existing smoke executable is not itself the browser runtime.
3. **Publish build artifacts for review** (JS loader, WASM binary, license/notice inventory, checksums, build metadata). Do not silently commit or deploy generated binaries.
4. **Add a fail-closed browser adapter** that validates exact complete text-object matches, rejects ambiguous/unsupported cases, preserves original bytes on errors, and exposes a narrow API.
5. **Add editor UI affordance only after the browser module is available.** Existing overlay editing remains the fallback; no silent replacement of text.
6. **Browser acceptance tests**: Chromium desktop and mobile viewport, PDF loaded from local device, nested Form replacement, export, close/reopen exported file, text extraction, visual comparison, and unchanged controls.
7. **Compatibility matrix**: ordinary page text; single/nested Forms; transforms; clipping; local/inherited resources; Hindi/Unicode fonts; RTL; rotated text/pages; encrypted/malformed PDFs; image-only/outlined text. Unsupported cases must fail closed.
8. **Privacy and deployment audit**: verify no PDF bytes leave the browser; review PDFium and bundled third-party license notices; verify WASM size/load time and mobile memory; test Cloudflare Pages preview before any production release.

## Release gates

- Native editing remains disabled until the browser-loadable runtime, adapter, and browser Save/Reopen tests pass.
- No production deployment or change to `main` is authorized by this branch work.
- Do not describe the editor as supporting arbitrary PDF text replacement. The current proof is limited to the synthetic fixture and pinned runtime revision.
