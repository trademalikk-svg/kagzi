# KAGZI PDF Editor Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade KAGZI's existing PDF workspace into a mobile-friendly editor with browser-first annotations and page management, while reserving explicitly consented server processing for a later backend-ready phase.

**Architecture:** Preserve KAGZI's static HTML/CSS/JS architecture. Add a dedicated editor page that reuses the existing PDF.js, pdf-lib, and JSZip CDN dependencies, with isolated editor logic and styles. Browser operations keep file bytes local; a server-processing adapter remains disabled until a real private processor, temporary storage, deletion policy, and consent flow are configured.

**Tech Stack:** HTML, CSS, vanilla JavaScript, PDF.js 3.11.174, pdf-lib 1.17.1, JSZip 3.10.1; existing Cloudflare Pages deployment. No package.json or test runner was found at repository root.

## Global Constraints

- Browser processing is the default; never upload a document without explicit user action and notice.
- Initial editing adds overlays; it does not claim to rewrite arbitrary existing PDF text.
- Visual whiteout is not secure redaction. Secure redaction is excluded until permanent content removal is independently verified.
- Do not claim server processing is available until a real processor and private temporary-storage lifecycle are configured.
- Preserve source files on errors; show success only after a valid output is generated.
- Do not send document bytes or extracted text to analytics or logs.
- Keep existing KAGZI pages and tools working; support phone and desktop; keep Hindi/English-friendly labels.

---

### Task 1: Create the dedicated editor workspace

**Files:**
- Create: `pdf-editor.html`
- Create: `pdf-editor.css`
- Modify: `index.html` (PDF Studio navigation/entry link only)
- Test: manual browser smoke checks; no repository test runner was found.

**Interfaces:**
- Page loads PDF.js, pdf-lib, and JSZip from the same pinned CDN versions already used by `index.html`.
- Editor DOM contract: `#pdfFileInput`, `#pdfCanvas`, `#pageNumber`, `#pageCount`, `#zoomIn`, `#zoomOut`, `#textTool`, `#imageTool`, `#highlightTool`, `#rotatePage`, `#deletePage`, `#movePageUp`, `#movePageDown`, `#undoEdit`, `#downloadEditedPdf`, `#editorStatus`.
- Editor script API: `initPdfEditor({ pdfjsLib, PDFLib, JSZip, elements })`; initialization is idempotent and fails visibly if a required library is missing.

- [ ] **Step 1: Add a focused manual test checklist**
  - Record expected page behavior: empty state, one valid PDF, malformed file, password-protected file, 1-page PDF, multi-page PDF, phone viewport, missing CDN library.
- [ ] **Step 2: Verify current baseline**
  - Inspect the existing KAGZI homepage and PDF tools page before changes.
  - Expected: homepage has the existing PDF Studio section and loads the pinned libraries; `pdf-tools.html` links to homepage anchors.
- [ ] **Step 3: Build the editor shell**
  - Create a responsive page with file selection, page preview canvas, page navigation, zoom, toolbar, status/progress region, and export action.
  - Add an entry point from the existing PDF Studio section and PDF tools landing page.
  - Show a privacy notice: local browser processing; file is not uploaded by this editor.
- [ ] **Step 4: Verify shell**
  - Open `pdf-editor.html` on desktop and a narrow mobile viewport.
  - Expected: no horizontal overflow; controls are keyboard reachable; empty state and missing-library state are readable.
- [ ] **Step 5: Verify homepage integration**
  - Open the homepage and follow the PDF Editor link.
  - Expected: the editor loads without breaking existing PDF tools.
- [ ] **Step 6: Commit**
  - `git add pdf-editor.html pdf-editor.css index.html`
  - `git commit -m "feat: add KAGZI PDF editor workspace"`

### Task 2: Implement browser PDF loading, preview, and navigation

**Files:**
- Create: `pdf-editor.js`
- Modify: `pdf-editor.html` (load the editor module)
- Test: manual browser checks listed below.

**Interfaces:**
- `initPdfEditor({ pdfjsLib, PDFLib, JSZip, elements })` binds the editor DOM.
- Internal document state contains the original `File`, loaded PDF.js document, current page index, zoom scale, and edit history. It is cleared when a new file is selected or the page is closed.
- Rendering uses PDF.js; modifications/export use pdf-lib. PDF.js worker URL is pinned to the same 3.11.174 version as the library.

- [ ] **Step 1: Add failing checks**
  - Check file selection accepts PDFs only; page count reflects document; previous/next stay within bounds; zoom stays within defined minimum/maximum; malformed and encrypted PDFs show errors without losing the previous source file.
- [ ] **Step 2: Verify baseline failure**
  - Run the manual checklist against the empty shell.
  - Expected: controls have no document behavior yet.
- [ ] **Step 3: Implement load/render/navigation**
  - Validate extension and MIME hints, then let PDF.js parse actual bytes; do not trust filename alone.
  - Render only the active page to canvas; render thumbnails lazily if included.
  - Catch parse, password, worker-load, and canvas failures; keep the source file available for retry.
  - Revoke object URLs and release PDF.js resources when replacing/closing a document.
- [ ] **Step 4: Verify focused behavior**
  - Load a valid 1-page and multi-page PDF; navigate first/last boundaries; zoom; replace with another file.
  - Expected: correct page count and visible page, no stale page after replacement, no uncaught errors.
- [ ] **Step 5: Integration check**
  - Navigate from homepage to editor and back; verify other homepage PDF utilities still respond.
- [ ] **Step 6: Commit**
  - `git add pdf-editor.js pdf-editor.html`
  - `git commit -m "feat: render and navigate PDF documents"`

### Task 3: Add overlays and page operations with valid PDF export

**Files:**
- Modify: `pdf-editor.js`
- Modify: `pdf-editor.html` (text/image/highlight property controls and page order panel)
- Modify: `pdf-editor.css`
- Test: manual export verification in independent PDF viewers.

**Interfaces:**
- Overlay state is stored as page-indexed text/image/highlight annotations in PDF page coordinates.
- Export uses pdf-lib and returns a Blob through one download helper; only the output Blob is downloaded.
- Page operations update a working PDF document copy; the original selected File remains untouched.

- [ ] **Step 1: Add failing checks**
  - Verify text placement and size limits; image placement for PNG/JPEG; highlight overlay; page rotation; delete page cannot produce a zero-page PDF; reorder preserves the requested order; export produces a non-empty PDF.
- [ ] **Step 2: Verify baseline failure**
  - Run each check against the current viewer.
  - Expected: editing and page mutation controls are not yet functional.
- [ ] **Step 3: Implement overlays and operations**
  - Add text using standard fonts; allow an optional user-selected TTF/OTF font for scripts supported by the font file.
  - Embed selected PNG/JPEG images; reject unsupported image types with a specific message.
  - Implement highlight as a translucent visual overlay, not a secure redaction mechanism.
  - Add rotate, delete, and reorder actions; preserve at least one page.
  - Provide undo for the most recent edit/page operation where practical; if an operation cannot be undone, do not display a working undo affordance.
  - Export from the working copy; revoke download object URLs after use.
- [ ] **Step 4: Verify focused pass**
  - Export documents with text, image, highlight, rotation, deletion, and reordered pages.
  - Expected: output opens in a separate PDF viewer; page count/order/orientation and overlays match the preview.
- [ ] **Step 5: Integration check**
  - Test large multi-page input on a mobile viewport; if memory failure occurs, preserve the original and show a local-limit message.
- [ ] **Step 6: Commit**
  - `git add pdf-editor.js pdf-editor.html pdf-editor.css`
  - `git commit -m "feat: add PDF annotations and page editing"`

### Task 4: Add explicit server-processing boundary and release checks

**Files:**
- Create: `pdf-server-adapter.js` (disabled adapter contract only until backend is configured)
- Modify: `pdf-editor.js`
- Modify: `pdf-editor.html`
- Modify: `pdf-tools.html`
- Test: browser network inspection and manual privacy/error checks.

**Interfaces:**
- `serverProcessingAvailable()` returns `false` until a configured endpoint and processor health contract are supplied.
- `requestServerProcessing({ file, operation, consent })` refuses unless explicit consent is true and the adapter reports availability.
- No server endpoint, Supabase Storage bucket, or Worker URL is assumed by this plan.

- [ ] **Step 1: Add failing privacy checks**
  - Confirm local editing causes no request containing file bytes; server action cannot proceed without consent; unavailable backend shows an explanatory disabled state.
- [ ] **Step 2: Verify baseline failure**
  - Expected: no server adapter exists and no remote processing can run.
- [ ] **Step 3: Implement safe adapter boundary**
  - Keep server processing disabled by default.
  - Add a consent notice and disabled/unavailable UI; do not upload any file in this release.
  - Document backend prerequisites: private temporary storage, MIME/signature validation, per-job isolation, limits, retention disclosure, automatic deletion, no content logging, and verified processor.
  - Update PDF tools page wording so it does not imply server processing is live.
- [ ] **Step 4: Verify focused pass**
  - Expected: no file upload from local workflows; attempted server action is rejected while unavailable; original file remains available.
- [ ] **Step 5: Release integration check**
  - Verify homepage, PDF tools landing page, editor, and existing PDF tools; inspect mobile layout and console/network output.
  - Deploy through the existing Cloudflare Pages pipeline and verify the deployment status is successful before describing it as live.
- [ ] **Step 6: Commit**
  - `git add pdf-server-adapter.js pdf-editor.js pdf-editor.html pdf-tools.html`
  - `git commit -m "feat: define consent-based PDF processing boundary"`

---

## Unresolved product decisions

1. Server-side processor and private temporary-storage provider are not configured in the repository; server processing must remain disabled until selected and verified.
2. Maximum local file size/page count should be measured on representative mobile devices before a public limit is advertised.
3. Hindi text rendering depends on a user-provided compatible font until a licensed bundled font is selected.
