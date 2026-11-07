# CropBox Overlay Placement Test Design

Date: 2026-11-07
Repository: trademalikk-svg/kagzi
Target branch: experiment/pdfcanvas-poc
Scope: CI-only regression test; no production editor enablement.

## Goal

Verify that text replacement in a PDF page with a non-zero CropBox origin is placed at the intended visible-page position and does not alter rendered pixels outside the visible CropBox.

## Recommended approach

Use PDF.js to render the original fixture and the edited output at the same scale and rotation. Compare the rendered bitmaps and use PDF.js text extraction to confirm that the replacement text is present at the expected viewport position while the original text is absent. Keep the existing PDFium coordinate checks as a separate cross-check rather than treating text coordinates alone as proof of visual placement.

## Fixture

Create a deterministic one-page PDF with:
- a MediaBox larger than its CropBox;
- a CropBox with non-zero left and bottom offsets;
- a target text run inside the CropBox;
- a control text run elsewhere inside the CropBox;
- a sentinel outside the CropBox, where supported by the renderer's page clipping behavior.

Use fixed fonts, coordinates, render scale, and fixture content so CI comparisons are reproducible.

## Assertions

1. The edited PDF opens and renders successfully in PDF.js.
2. PDF.js text extraction contains the replacement string and does not contain the original target string.
3. The replacement text's rendered location is within a documented pixel tolerance of the expected CropBox-relative viewport location.
4. The control text remains present and its rendered region remains unchanged within the defined comparison tolerance.
5. No changed pixels occur outside the CropBox's rendered viewport bounds.
6. The test fails closed on missing text, unexpected geometry, render errors, or out-of-bounds pixel changes.

## Comparison rules

Render original and edited PDFs with identical PDF.js version, viewport scale, rotation, and canvas dimensions. Compare RGBA pixels. Mask only the expected target-text replacement region when checking unrelated in-CropBox preservation; do not mask the CropBox boundary or any area outside it. The outside-CropBox assertion must have a zero-difference requirement. Any tolerance for antialiasing inside the target region must be explicit and must not weaken the outside-CropBox check.

## Failure handling and release boundary

A failed or inconclusive assertion leaves CropBox overlay replacement marked unverified/blocked. The workflow summary must not promote the capability to supported. General Form XObject editing remains Disabled, and this experiment must not change production code, production branch, or deployment.

## CI integration

Add the regression to the existing `.github/workflows/pdfcanvas-poc.yml` experiment workflow. Keep it deterministic and run it in the existing test job. Update the workflow summary only after the assertions pass; otherwise the workflow's failure status must make the summary unavailable or clearly indicate failure.

## Non-goals

- Enabling general Form XObject editing.
- Enabling nested Form XObject editing.
- Claiming universal CropBox support from one synthetic fixture.
- Changing production behavior, authentication, billing, or unrelated PDF editor features.
