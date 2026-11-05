# KAGZI PDF Editor — Rendering Fix Progress

## User-reported issues
- PDF preview appears blurry.
- Page rendering is choppy.
- Editing appears not to work as expected.

## Changes on `pdf-editor-design`
- Added high-DPI canvas rendering (device pixel ratio capped at 2) while keeping CSS page dimensions stable.
- Serialized canvas rendering: cancel and await the previous PDF.js render task before starting a new one.
- Removed an unnecessary eager pdf-lib parse during initial file opening.
- Added automated render-metrics tests in `tests/pdf-editor-render-audit.mjs`.

## Important capability limitation
- Text tool adds a new overlay; it does not replace existing PDF text in place.
- Highlight is a visual overlay, not secure redaction.
- True text replacement needs a separate text-layer/content-stream workflow and possibly OCR for scanned PDFs. This prototype is not yet a full Sejda-equivalent editor.

## Verification still required
- Confirm automated PDF editor tests pass on latest commit.
- Test a multi-page PDF on Android Chrome and desktop.
- Verify sharpness, page navigation, overlay placement and export in an independent PDF reader.
- Large PDFs may still be limited by browser memory; server processing is not configured.
- Keep PR #27 in draft until hands-on PDF tests pass.
