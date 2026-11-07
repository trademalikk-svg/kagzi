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


## Follow-up research: PDFium WASM editor candidate

A further candidate was inspected at the source level: [Frenxys/pdfcanvas](https://github.com/Frenxys/pdfcanvas), package version 0.9.0 at the time of review.

- Its package declares MIT licensing, and its source uses `@embedpdf/pdfium` WASM alongside PDF.js and pdf-lib.
- Unlike the previously reviewed generic PDFium wrappers, its source includes a concrete `PdfiumTextEngine` that reads PDFium text objects and attempts in-place text replacement, deletion, movement, and round-trip text checks.
- It is therefore the first practical permissive-license prototype candidate found in this review.

Important gaps against KAGZI's approved safety requirements:

1. The candidate groups text objects into line runs and has specialized replacement paths; this is not proof of reliable support for arbitrary PDF content streams, text encodings, glyph maps, vertical/rotated text, clipping, transparency, or complex layouts.
2. Its current source explicitly skips rotated text runs in the inspected reader path (`displayRotation !== 0`, and non-horizontal text matrices are skipped).
3. It has automatic fallback-font paths for some replacements. KAGZI requires explicit user approval before any fallback font is used; this behavior must be changed or disabled.
4. The implementation uses PDFium text-object APIs and regenerates page content. It needs adversarial fixture tests and export-level checks for unrelated content, page count, geometry, and original-byte preservation.
5. The package's own README labels its editing model/API as subject to change. Its current version and dependency/WASM notices must be pinned and audited before adoption.

**Decision:** shortlist pdfcanvas/PDFium WASM for an isolated proof-of-concept only. Do not integrate it into KAGZI yet. First create a local fixture harness and test the exact pinned package against the approved fixture matrix. Any unsupported or ambiguous case must return `unsupported`; font substitution must pause for explicit approval. This candidate does not change the no-production-change or no-merge decision.

Source files inspected:
- https://github.com/Frenxys/pdfcanvas/blob/main/README.md
- https://github.com/Frenxys/pdfcanvas/blob/main/package.json
- https://github.com/Frenxys/pdfcanvas/blob/main/src/pdfium.ts
- https://github.com/Frenxys/pdfcanvas/blob/main/CHANGELOG.md

## Follow-up research: bundled PDFium license diligence (2026-11-07)

The dependency license check for the shortlisted `pdfcanvas@0.9.0` candidate was extended beyond the top-level package:

- `pdfcanvas` declares MIT in its package metadata and includes an MIT license file.
- Its direct dependency `@embedpdf/pdfium@^2.15.1` declares the JavaScript wrapper as MIT. The published npm package documentation separately states that its bundled PDFium WebAssembly build is Apache-2.0.
- The upstream PDFium project publishes its own license and bundled third-party notices. The upstream license text includes BSD-3-Clause terms and Apache-2.0 material; individual bundled libraries retain their own notices and conditions.
- A public third-party-notices disclosure for the same `@embedpdf/pdfium` version lists the wrapper as MIT and PDFium as BSD-3-Clause plus Apache-2.0, with additional notices for FreeType, libjpeg-turbo, OpenJPEG, Little CMS, libpng, zlib, ICU and other bundled components.

References:
- npm package metadata and license statement: https://www.npmjs.com/package/@embedpdf/pdfium
- PDFium upstream license: https://pdfium.googlesource.com/pdfium/+/main/LICENSE
- Example detailed third-party notices for `@embedpdf/pdfium@2.15.1`: https://aequis.idamil.com/legal/third-party-notices

**License conclusion:** the candidate appears to use permissive licenses rather than an AGPL-only engine, but KAGZI must preserve the exact notices shipped with the pinned npm tarballs/WASM assets. The package-level MIT declaration alone is not a sufficient notice audit. Before adoption, inspect the exact lockfile-resolved dependency versions and copy their LICENSE/NOTICE files into KAGZI's third-party notices. This is a technical compliance checklist, not legal advice.

**Version discrepancy:** the package metadata inspected identifies version `0.9.0`, while the README's status banner still says `0.8.x`. Treat the README as stale for versioning; pin an exact tested package version rather than using a floating semver range.

**Decision unchanged:** no dependency has been added, no PDF engine has been integrated, and no runtime code has been modified. A local fixture harness and adversarial PDF tests are still required before adoption.


## KAGZI editor integration boundary (2026-11-07)

The isolated PDFcanvas fixture workflow now has a fail-closed runtime boundary:

- `pdf-native-text-gate.js` exposes `window.KAGZIPdfNativeText.status()` and a `replaceText()` method that rejects with `KAGZI_NATIVE_TEXT_EDIT_DISABLED`.
- The gate is loaded before `pdf-editor.js` on the experiment branch only. It does not load PDFium WASM, alter document bytes, or change the existing overlay editor.
- The gate remains explicitly unavailable until a real editor integration proves replacement on save, reopen, and re-extraction for supported fixtures, with page geometry and unrelated content preserved.
- `tests/pdf-native-text-gate.test.mjs` verifies the disabled status, that an unverified engine is never invoked, and that the gate loads before the editor controller. The PDFcanvas workflow runs this test on every push to the experiment branch.

This is a safety integration checkpoint, not native text-editing feature delivery. The existing editor remains overlay-based. Do not enable or merge native editing based only on the dependency spike or synthetic fixture results.

### Nested Form serialization follow-up (2026-11-07)

The first dirty-flag probe marked only the page-level outer Form dirty by writing back its unchanged matrix. That was insufficient: the deepest child was removed in memory, but the original text remained after save/reopen.

A second diagnostic reproduced the dirty propagation needed at both levels:
- After removing the deepest text child from the inner Form, mark the Form object that owns that child (`middlePtr`) dirty.
- Mark the page-level outer Form object dirty as well.
- Call `FPDFPage_GenerateContent`, save, reopen, and verify text extraction plus PDF.js pixel differences.

For this isolated synthetic nested-nested fixture, the second probe passed:
- Replacement text found after reopen.
- Original text absent after reopen.
- 124 changed pixels inside the combined target bounds.
- 0 changed pixels outside those bounds.
- 0 changes to the same-line control.

This points to dirty propagation at each Form-object level as the missing serialization trigger. The upstream PDFium implementation of `FPDFFormObj_RemoveObject` now marks the Form object that owns the removed child dirty; the older pinned WASM behavior needs this path verified against its exact implementation/version before any dependency change. The diagnostic uses an active-state toggle solely to emulate dirty marking; it is not an approved production mutation strategy.

**Support boundary:** nested-nested replacement is now verified for this one synthetic fixture when both Form levels are explicitly marked dirty. This does not establish general nested Form support, arbitrary resource inheritance, clipping, or preservation across real-world PDFs. Keep the runtime native-edit gate closed until the pinned engine provides a supported dirty-propagation path and the broader fixture matrix passes.

The probe remains isolated to the experiment workflow and does not alter the editor runtime or production branch.


## Exact pinned PDFium dirty-propagation source audit (2026-11-07)

The dependency chain is now resolved to the source revision used to build the exact locked WASM package:

- `pdfcanvas@0.9.0` resolves `@embedpdf/pdfium@2.15.1` in its lockfile.
- The `@embedpdf/pdfium@2.15.1` release metadata points to `embedpdf/runtime` commit `42388d3b4c9895d6672f5da357b1429678a0994c`.
- In that exact runtime source, `FPDFFormObj_RemoveObject` calls `cform_page_object->SetDirty(true)` after removing the child. This marks the Form object that directly owns the removed child; it does not walk and dirty every ancestor Form object.
- In the same pinned source, `CPDF_PageContentGenerator::ProcessForm` checks `form_xobject->HasDirtyStreams()` and regenerates the Form content stream when dirty. The containing page/Form must itself be processed for that check to run.

This source-level explanation matches the fixture evidence: removal dirties the Form containing the child, while the containing page-level Form also needs a dirty trigger so the serializer reaches the nested Form and regenerates its stream. The diagnostic active-state toggle in the fixture is only a test probe; it is not approved as a production API strategy.

The isolated PDFcanvas workflow now checks out the exact runtime source commit and asserts these implementation details on each experiment-branch run. The audit also confirms that `CPDF_PageObject::SetIsActive(bool)` sets `dirty_ = true` when the active state changes. Toggling an ancestor Form off and back on therefore restores its original active state while leaving its dirty flag set; the workflow uses this only as a fixture diagnostic to force serialization through each ancestor level. It is not an approved production mutation strategy or a supported public dirty-marking API.

The CI run on commit `505d47137fe74e026307bced517bab1679bd68ab` completed successfully (workflow run #114). The nested-nested round-trip fixture reported `NESTED_FIXTURE_PASS`: replacement text was found after reopen, original text was absent, 124 pixels changed inside the target bounds, 0 outside, and 0 pixels changed in the same-line control. Earlier probes using direct child removal alone and unchanged `SetMatrix` calls did not persist the nested edit. This isolates the successful result to explicit dirty propagation on both ancestor Form objects in this synthetic fixture.

This is a source-regression guard and one synthetic fixture result, not proof that all nested Forms, resources, clipping combinations, or real-world PDFs are supported. Intersecting nested clipping paths remain blocked; arbitrary resource inheritance and broader preservation still require separate proofs. General Form XObject editing remains disabled.

### Nested Form resource-inheritance follow-up (2026-11-07)

The exact pinned PDFium source was audited for resource resolution:

- `CPDF_Form::ChooseResourcesDict()` selects the Form's own `/Resources` dictionary when present.
- If the Form has no local resources, it selects the parent Form's resource dictionary; if there is no parent resource dictionary, it falls back to the page resource dictionary.
- `CPDF_StreamContentParser` passes the local, parent, and page resource dictionaries into this selection path.

The isolated CI workflow now tests two generated PDFs with the Form-local `/Resources` entry deliberately removed and the font dictionary hoisted to the fallback owner:

- **Page-resource fallback:** PDFium successfully discovered the text using the page's font dictionary.
- **Parent-Form-resource fallback:** PDFium successfully discovered the text through a nested Form using its parent Form's font dictionary.

CI run #120 completed successfully on commit `665924ef142eb78da79c49941701a7792f1a6dcd`. Both cases returned the exact sentinel text after PDFium parsing.

A follow-up mutation fixture then removed the deepest text object from the nested child Form while that Form inherited its font dictionary from the parent Form. The test marked both Form ancestors dirty using the same fixture-only active-state diagnostic, generated page content, saved, reopened, and verified that the original nested text stayed absent while an unrelated page-level control remained. CI run #126 passed this synthetic deletion round-trip.

**Resource-name collision follow-up (2026-11-07):** two independent PDF.js + PDFium fixtures now verify font alias precedence:

- A Form-local Helvetica alias remained in effect when the page defined the same resource name as Courier (baseline and collision text widths both 328.122 pt).
- A nested child Form with no local `/Resources` continued to use its parent Form's Helvetica alias when the outer page defined the same name as Courier (both widths 321.102 pt).

CI run #132 verified local-Form-over-page precedence; CI run #134 verified parent-Form-over-page precedence. Both runs passed. These are generated font-alias collision fixtures only; they do not yet verify resource-name collision behavior during text replacement or arbitrary resource dictionaries.

**Scope:** these are parser/resource-resolution discovery tests only. They do not prove safe text replacement, nested Form stream regeneration with inherited resources, resource-name collision handling, or visual preservation after editing. Those remain separate gates.

### Intersecting clipping-path fixture correction (2026-11-07)

The earlier intersecting-clip test compared a page before and after drawing the exact same text at the same coordinates. That made a zero-pixel difference ambiguous: the test could not distinguish an unchanged original from a successful same-text replacement. The fixture was corrected to:

- Verify that the original Form text is absent after PDFium removal and Save/Reopen.
- Draw a distinct replacement string under two sequential rectangular clipping paths.
- Verify that the replacement is present and the original is absent after PDF.js reopen.
- Compare rendered pixels against the intersection and unrelated control region.

CI run #123 completed successfully on commit `f890997c44ee11109fdb45baee66d1e62bc5e217`: 220 changed pixels inside the intersection, 0 outside, and 0 changes to the unrelated control.

**Scope:** this establishes only this synthetic two-rectangle intersection. Arbitrary clip paths, transformed clipping paths, even-odd rules, Bezier paths, and nested clipping combinations remain unverified. General Form XObject editing remains disabled.

Pinned source references:
- https://github.com/embedpdf/runtime/blob/42388d3b4c9895d6672f5da357b1429678a0994c/fpdfsdk/fpdf_editpage.cpp
- https://github.com/embedpdf/runtime/blob/42388d3b4c9895d6672f5da357b1429678a0994c/core/fpdfapi/edit/cpdf_pagecontentgenerator.cpp
- https://github.com/embedpdf/embed-pdf-viewer/blob/176ec6daac51458c9e80733b9c92a66a3bc5e2d1/packages/engine/runtime/engine-runtime-build.json
