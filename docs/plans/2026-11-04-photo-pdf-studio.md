# KAGZI Photo and PDF Studio Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade KAGZI Photo Studio and PDF workspace into a consistent, responsive suite with practical browser-local image and PDF workflows.

**Architecture:** Preserve the existing single-page workspace and its vanilla JavaScript structure. Keep image/PDF processing in the browser, use the existing Canvas, PDFLib, PDF.js and JSZip dependencies, and load AI background removal only when requested. Add shared visual navigation and status/preview patterns without changing authentication, storage, quota or payment behavior.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Canvas API, PDFLib, PDF.js, JSZip, browser File APIs.

## Global Constraints

- Work only on `feature/kagzi-photo-pdf-studio`, based on `fix/kagzi-dashboard-repair`; do not modify `main` or merge/deploy.
- Do not upload user files automatically. Image/PDF transformations remain local in the browser.
- AI background removal may fetch its code/model assets from a public CDN on explicit user action; disclose this before starting and do not send the user's image to a KAGZI server.
- Keep the original file unchanged; downloads are new copies.
- Maintain Android Chrome usability and responsive layouts.
- Do not change the 65-module catalogue, subscription, quota, authentication, or Supabase behavior.
- Existing PDF compression rasterises pages; preserve a visible warning that text/searchability may be lost.
- Passport/visa dimensions are presets only; users must verify the destination authority's current photo rules.

---

### Task 1: Shared Studio navigation and visual layout

**Files:**
- Modify: `index.html` — PDF and Photo Studio sections
- Modify: `style.css` — shared studio navigation, cards, responsive controls
- Test: `tests/studio-ui-audit.mjs`

**Interfaces:**
- Consumes: existing `#pdfWorkbench`, `#photoStudio`, `.pdf-actions`, `.pdf-action-card`
- Produces: consistent studio tool navigation, status region, preview region and mobile card layout

- [ ] Add a focused static audit for unique IDs, matching labels, required tool sections and responsive CSS hooks.
- [ ] Run `node --test tests/studio-ui-audit.mjs`; confirm it fails before the UI is added.
- [ ] Add a common studio toolbar and group cards into clear sections while retaining existing element IDs and handlers.
- [ ] Run the audit; confirm unique IDs, all labels resolve and both workspaces expose the agreed tool inventory.
- [ ] Run `node --check script.js` and the existing dashboard audit.
- [ ] Commit the UI-only deliverable.

### Task 2: Complete Photo Studio browser-local workflows

**Files:**
- Modify: `index.html` — Photo Studio controls and preview/status
- Modify: `script.js` — image processing workflows
- Modify: `style.css` — photo control layout
- Test: `tests/studio-ui-audit.mjs` and manual Android Chrome checks

**Interfaces:**
- Consumes: `photoInput`, `photoObjectUrl`, `photoOriginalWidth`, `photoOriginalHeight`, existing Canvas export flow
- Produces: resize, aspect-ratio presets, passport/visa dimension presets, crop, rotate, output format, quality/target-size compression, preview and download handlers

- [ ] Add assertions for photo controls and their IDs.
- [ ] Run the focused audit and confirm the new controls are absent.
- [ ] Implement crop/rotate and dimension presets with bounds checks; preserve aspect ratio when selected.
- [ ] Implement target-size compression by testing descending JPEG quality values and report when the requested size cannot be reached.
- [ ] Implement manual background fill for transparent images and lazy AI cut-out behind explicit user action; show the CDN/model download disclosure before loading AI assets.
- [ ] Verify corrupt images, unsupported formats, empty inputs, oversized dimensions and unavailable network assets produce readable messages.
- [ ] Run `node --check script.js` and focused audit; manually test output on Android Chrome.
- [ ] Commit the passing Photo Studio deliverable.

### Task 3: Complete PDF Studio presentation and preview

**Files:**
- Modify: `index.html` — PDF Studio grouping, file preview/status
- Modify: `script.js` — preview and consistent status feedback
- Modify: `style.css` — shared PDF studio layout
- Test: `tests/studio-ui-audit.mjs` and manual PDF regression checks

**Interfaces:**
- Consumes: existing PDFLib, PDF.js, JSZip helpers and all current PDF action handlers
- Produces: grouped Merge, Split/Extract, Compress, Page Manager, Convert, Add-text Editor and PDF Preview sections

- [ ] Add assertions for all agreed PDF tool groups and preview controls.
- [ ] Run the focused audit and confirm missing presentation/preview markers.
- [ ] Reorganise existing cards without renaming their input/button IDs or changing their processing semantics.
- [ ] Add a local PDF preview using PDF.js with loading/error/cleanup behavior; do not upload files.
- [ ] Keep rasterisation and selectable-text limitations visible beside compression.
- [ ] Run `node --check script.js`, focused audit and existing dashboard audit.
- [ ] Manually regression-test merge, split, extract, compress, remove, rotate, reorder, image-to-PDF, PDF-to-images and add-text.
- [ ] Commit the passing PDF Studio deliverable.

### Task 4: Release verification

**Files:**
- Modify: `tests/mobile-acceptance.md`
- Test: `tests/dashboard-audit.mjs`, `tests/studio-ui-audit.mjs`

**Interfaces:**
- Consumes: completed Photo/PDF UI and workflows
- Produces: documented Android/desktop acceptance checklist and verified preview branch

- [ ] Run `node --test tests/dashboard-audit.mjs tests/studio-ui-audit.mjs`.
- [ ] Run `node --check script.js`.
- [ ] Test 360–390 px Android Chrome layout, file selection, processing, preview, download and browser Back/refresh.
- [ ] Test desktop Chromium and all PDF/photo regression cases.
- [ ] Record any unverified AI model/network limitation; do not mark the suite launch-ready if any workflow is untested.
- [ ] Open a draft PR for review; do not merge or launch without the user's explicit approval.

## Unresolved externally observable decisions

- Exact passport/visa dimensions and print-sheet layout vary by issuing authority. Initial presets will be labelled as common starting sizes, not official guarantees.
- AI background-removal model availability depends on the user's browser memory, network and CDN access; manual transparent-background fill remains available when AI cannot load.
- Target-size compression may not achieve a requested KB value for every image; the UI must report actual output size rather than promise an exact result.
