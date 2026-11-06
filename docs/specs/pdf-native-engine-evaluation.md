# KAGZI PDF Native Text Editing — Engine Evaluation

**Date:** 2026-11-07  
**Repository:** `trademalikk-svg/kagzi`  
**Target branch:** `feature/pdf-studio-task1-mobile-workspace`  
**Status:** Evaluation complete; no engine adopted.

## Executive summary

The current stack cannot perform general page-text replacement. The existing PDF.js + pdf-lib combination supports rendering, text-layer selection, page operations, form-field editing, and drawing new content, but pdf-lib explicitly states that it does not provide APIs to extract, remove, or edit ordinary page text outside form fields.

Three candidate routes were reviewed:

1. **MuPDF.js:** Technically the strongest candidate to prototype for broad PDF manipulation, but its official distribution is AGPL or commercial. It must not be added until the owner reviews the exact license and separately approves the distribution model.
2. **PDF.js + pdf-lib:** Lowest-friction and compatible with the current application, but it does not meet the core native page-text replacement requirement on its own. A custom content-stream/font rewrite would be a substantial PDF-engine project and must not be presented as a safe quick patch.
3. **PDFium:** BSD-3-Clause core license is attractive for commercial distribution with notices, but the reviewed official project is a native C++ PDF engine, not a ready-to-use browser JavaScript text-editing API. A WASM integration and a separate editing layer would still need to be engineered and proven.

Commercial SDKs such as Apryse expose existing content editing, but they require a commercial production license and therefore do not meet the current ₹0 target.

## Candidate comparison

| Candidate | License / distribution | Relevant capability | Fit for KAGZI |
|---|---|---|---|
| MuPDF.js | AGPL-3.0-or-later or commercial license | Official JS/WASM bindings; document operations and content extraction/manipulation | Strongest prototype candidate; blocked pending owner license review |
| PDF.js | Apache-2.0 | PDF parsing, rendering, text extraction layer | Keep for rendering/selection; not a page-content text replacement engine |
| pdf-lib | MIT | PDF modification, drawing, forms, page operations | Keep for current operations; official README says ordinary page text cannot be extracted/edited through its API |
| PDFium | BSD-3-Clause core; bundled third-party notices also required | Native PDF rendering and low-level PDF APIs | Possible longer-term WASM research; no ready-made high-level browser text replacement route established |
| Apryse WebViewer | Commercial SDK; production license required | Existing content editing UI and APIs | Technically capable but outside ₹0 runtime constraint |

## License review: MuPDF.js

Official MuPDF documentation says MuPDF.js is distributed under either the GNU AGPL or a commercial license. Artifex's license page describes AGPL conditions and states that systems built with the AGPL version require source availability under the license's terms. A commercial license is offered for users who do not want to comply with AGPL conditions.

Practical questions before adoption:

- KAGZI is intended to be a commercial online service. The exact deployment, modification, distribution, and browser-delivery model should be reviewed against the complete AGPL text and Artifex's licensing terms.
- AGPL can impose source-code availability obligations on modified covered software used to provide network services. The precise scope and compatibility with KAGZI's own code and deployment model require qualified legal review; this document is not legal advice.
- The commercial license may require payment and therefore may not satisfy the ₹0 target.
- No MuPDF package, WASM binary, or MuPDF-derived code should be added until the owner explicitly chooses a licensing route after review.

Official references:
- MuPDF.js WASM README and license: https://github.com/ArtifexSoftware/mupdf/blob/master/platform/wasm/README.md
- MuPDF license guide: https://mupdf.readthedocs.io/en/latest/license.html
- MuPDF.js documentation: https://mupdfjs.readthedocs.io/en/latest/faq/index.html

## Existing stack findings

- PDF.js is licensed Apache-2.0 and is designed as a general-purpose PDF parser and viewer.
- pdf-lib is MIT-licensed and supports document modification, page operations, drawing text/images, embedding fonts, and form-field editing.
- The pdf-lib project explicitly documents that it cannot extract ordinary page text or edit/remove ordinary page text outside form fields using its public APIs.
- KAGZI's current `pdf-unicode-text.js` draws complex-script text to a canvas and embeds it as a PNG. This is an image overlay, not searchable native text.
- Therefore, changing the UI alone or adding more calls to pdf-lib cannot deliver real arbitrary page-text replacement.

References:
- PDF.js repository and Apache-2.0 license: https://github.com/mozilla/pdf.js
- pdf-lib README and documented limitations: https://github.com/Hopding/pdf-lib
- PDFium official repository/license: https://pdfium.googlesource.com/pdfium/+/main/LICENSE
- Apryse content editing documentation: https://support.apryse.com/support/solutions/articles/35000251231-content-editing
- Apryse developer portal and production SDK information: https://dev.apryse.com/

## Recommendation

**Do not adopt a new engine yet.** MuPDF.js is the first candidate worth a technical spike, but only after the owner reviews and explicitly approves either the AGPL route or a commercial license. If neither route is acceptable, evaluate a PDFium WASM proof-of-concept and a narrowly scoped content-stream editing implementation. Neither should be advertised as supported until fixture tests demonstrate reliable replacement and export validation.

## Test scope required before a technical decision

A prototype must be tested against generated fixtures for:

- Standard-font English text.
- Compressed page content streams.
- Multiple text-showing operators and spacing adjustments.
- Hindi Unicode text with ToUnicode mapping.
- Right-to-left text.
- Subset embedded fonts.
- Image-only scanned pages.
- Outlined/vector text.
- Encrypted/restricted and malformed PDFs.

For every fixture, the engine must report one of: editable, OCR-required, or unsupported. It must not claim a replacement succeeded unless the exported PDF reopens and the replacement text can be verified. OCR reconstruction must append a new page and preserve the original scanned page. Font fallback must require explicit user approval.

## Decision gate

No engine has been integrated. Owner approval is required before any AGPL or commercial engine is adopted. The existing editor and production deployment remain unchanged.
