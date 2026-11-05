# KAGZI Professional PDF Studio — Design Specification

**Date:** 2026-11-05  
**Status:** Design approved; implementation not yet started  
**Repository:** `trademalikk-svg/kagzi`  
**Existing entry point:** `pdf-editor.html`

## 1. Goal

Evolve the existing KAGZI browser-based PDF editor into a professional PDF workspace with a polished, Acrobat-inspired workflow. The product will retain KAGZI branding and provide both local browser processing and optional cloud processing. This is an original interface and implementation; it will not copy Adobe's proprietary branding, assets, or exact interface.

The work is deliberately sequenced:
1. Complete and verify the core PDF capabilities.
2. Redesign the interface after the core workflows are reliable.

## 2. Existing implementation and constraints

The current editor uses PDF.js for rendering, pdf-lib for PDF manipulation, JSZip, Tesseract.js for OCR, and separate editor/OCR/scanner/server-adapter scripts. It already has basic page navigation, zoom, thumbnails, text/image/highlight tools, OCR, annotations, rotate, undo/redo, camera scanning, merge/split, image insertion, page movement/deletion, and a text-edit inspector.

Important known limitations:
- The current server adapter is intentionally disabled. Cloud processing is not available until a real backend is deployed and verified.
- Existing text replacement is overlay-based and does not guarantee faithful in-place editing of arbitrary PDF text, fonts, or complex scripts.
- OCR language data may need to be downloaded on first use.
- The existing browser-only workflow must remain usable when cloud services are unavailable.

The implementation must inspect and preserve the current code paths rather than replacing working functionality without regression tests.

## 3. Approaches considered

### A. Local-only processing
Lowest infrastructure cost and best for privacy, but unsuitable for large files or workloads that exceed browser memory and device capability.

### B. Cloud-only processing
Centralizes processing and supports heavier jobs, but requires uploads, backend operations, storage, operating costs, and stronger privacy controls. It also makes basic use dependent on network availability.

### C. Hybrid local + cloud processing — selected
Keep supported operations local by default and offer cloud processing as an explicit alternative. This balances privacy, offline resilience, and access to heavier processing. Cloud is not considered enabled until the backend, temporary storage, authentication, deletion lifecycle, and operational limits are implemented and tested.

## 4. User experience and processing modes

### 4.1 Mode selection
- **Local:** process supported tasks in the browser; do not upload the source document.
- **Cloud:** show the operation, file, purpose, and applicable retention choice before upload. Require an affirmative consent action for each cloud job.
- Clearly show the selected mode and job state: waiting, processing, complete, or failed.
- If cloud is unavailable, explain that the file was not uploaded and offer local processing when the operation is supported.

### 4.2 Cloud retention choice
Before each cloud job, the user must choose one of:
1. **Auto-delete:** delete the server-side working copy and derived temporary files after the job has completed and the result has been delivered, subject to a documented short-lived failure/retry window.
2. **Save to account:** retain the result in the user's authenticated account library, with a clear delete control and published retention policy.

The source file must not be retained merely because the result is saved. The implementation must define separately which source files, intermediate artifacts, and output files are retained. No cloud upload may occur before consent and retention choice are recorded.

### 4.3 Failure and cancellation
- Surface actionable errors without exposing secrets, internal paths, or raw server traces.
- Provide retry where safe and prevent duplicate jobs where possible.
- Cancellation must stop queued work where possible and trigger cleanup of temporary files.
- If delivery fails after processing, retain only what the selected policy permits and provide a clear recovery path.
- Show progress only when the backend can report meaningful progress; do not fabricate percentages.

## 5. Core capability scope

Capabilities are delivered in independently testable groups. A tool is not labelled available until its end-to-end workflow passes acceptance tests.

### 5.1 Document operations
- Open and preview PDFs; page navigation, zoom, fit modes, and page thumbnails.
- Merge multiple PDFs.
- Split by selected page ranges or extract selected pages.
- Reorder, rotate, duplicate, insert, and delete pages.
- Compress with a visible quality/size trade-off and report the resulting file size.
- Create PDFs from supported image and document inputs, with clear format and fidelity disclosures.
- Export/download and print.

### 5.2 Content editing and markup
- Add text, images, links, highlights, comments, and drawing/annotation marks.
- Support selection, move, resize, delete, undo, and redo for editor-created objects.
- Provide font, size, colour, opacity, alignment, and emphasis controls where the PDF engine supports them.
- Distinguish true PDF text editing from overlay-based correction. Where font embedding, layout preservation, or complex-script editing cannot be guaranteed, disclose the limitation rather than claiming full fidelity.
- Preserve original content unless the user explicitly applies an edit.

### 5.3 Conversion
- PDF to image formats (JPG/PNG) and image-to-PDF.
- PDF to Word/Excel and Word/Excel to PDF only where a supported conversion engine is integrated.
- Display a fidelity notice for conversions that reconstruct layout or may not preserve tables, fonts, forms, or complex scripts.
- Never present a renamed file or image-only export as an editable Word/Excel conversion.

### 5.4 OCR and scanning
- OCR for English, Hindi, Urdu, Bengali, Marathi, and other languages only when the selected language data is actually available.
- Local OCR remains available where supported; cloud OCR is an optional consent-based path.
- Allow review and correction of extracted text before export.
- Camera scanning should support capture, crop/rotate where available, page ordering, and PDF creation.
- OCR output must be labelled as extracted text, not guaranteed-perfect transcription.

### 5.5 Security and document controls
- Password-protect PDFs using supported encryption.
- Open/decrypt a protected PDF only when the user supplies the correct password and the operation is permitted.
- Add text/image watermarks and page numbers with configurable placement.
- Provide true redaction only when the implementation removes the underlying text/object content and verifies that it cannot be recovered through text extraction or copy/paste. A black rectangle overlay is not secure redaction and must never be labelled as such.
- E-signature means placing a user-provided signature mark or typed signature in the document; it is not a certificate-backed digital signature unless a separate signing infrastructure is added.
- Avoid claims of legal validity, tamper-proofing, or compliance without a separately verified basis.

## 6. Architecture

### 6.1 Front end
Retain the existing static-site structure and separate concerns across focused modules:
- Editor/workspace UI and interaction state.
- PDF rendering and page navigation.
- Local PDF operations.
- OCR and scanning.
- Cloud API adapter.
- File/job status and download handling.

Use explicit capability checks so unsupported operations are disabled or clearly marked rather than failing silently. Keep local processing functional independently of the cloud adapter.

### 6.2 Cloud service
A real cloud processor is a separate backend service; static hosting alone is not sufficient. The backend must provide:
- Authenticated job creation and ownership checks.
- Explicit consent and retention-policy validation on the server.
- Upload validation, file type checks, file-size/page limits, and rate limits.
- Isolated processing jobs and private temporary storage.
- Short-lived download links or authenticated result delivery.
- Automatic cleanup for temporary uploads, intermediate files, abandoned jobs, and expired outputs.
- Account storage only for outputs the user explicitly chooses to save.
- Audit-safe operational logs that do not record document contents or secrets.
- Clear limits, error responses, and service availability reporting.

The client must not contain privileged service credentials. Cloud storage must be private by default. Retention and cleanup must be enforced server-side, not merely by hiding a client-side item.

### 6.3 Data flow
**Local job:** select file → validate locally → process in browser → preview result → download/print. No upload.

**Cloud job:** select file and operation → show cloud disclosure and retention choice → record explicit consent → upload to private temporary storage → validate and process → deliver output → apply selected retention policy → confirm completion. If consent is absent or backend configuration is incomplete, do not upload.

## 7. Professional interface redesign (Phase 2)

After Phase 1 capabilities pass their acceptance tests, redesign the editor as a responsive, professional workspace:
- Top application bar: KAGZI identity, document name, save/export, and account controls where available.
- Left navigation: page thumbnails and document/page actions.
- Central canvas: document pages, selection, editing, and annotation.
- Right inspector: context-sensitive properties for the selected page or object.
- Clear tool groups for edit, annotate, organize, convert, OCR, protect, and export.
- Responsive layout for Android/mobile and desktop; mobile controls must remain usable without relying on hover.
- Accessible labels, keyboard focus, visible states, and readable contrast.

The redesign must preserve existing KAGZI routes and avoid introducing broken navigation or dead controls.

## 8. Security, privacy, and operational requirements

- Cloud uploads require per-job affirmative consent.
- Use TLS in transit and private storage at rest.
- Enforce authenticated access to saved outputs and prevent cross-account access.
- Validate file signatures and actual content, not filename extensions alone.
- Set documented maximum file size, page count, processing time, and concurrency limits.
- Defend against malformed PDFs, resource exhaustion, path traversal, and unsafe file handling.
- Delete temporary artifacts on success, failure, cancellation, and expiry.
- Provide a privacy notice describing cloud processing and retention in plain language.
- Never claim unlimited file size, zero retention, or a security guarantee unless technically verified.
- Local mode must not silently fall back to cloud.

## 9. Testing and acceptance criteria

### 9.1 Functional
- Each listed operation has a supported-format test fixture and a verified output.
- Merge/split/page operations preserve page count and page order as expected.
- Edited documents reopen in at least two independent PDF viewers.
- OCR returns selectable text and supports manual correction.
- Conversion tests verify actual output type and disclose known fidelity limits.
- Password protection is verified by reopening with and without the correct password.
- Redaction tests confirm that redacted text is absent from text extraction and cannot be recovered from the output.
- Downloaded files are non-empty, valid, and correctly named.

### 9.2 Privacy and cloud
- Local mode generates no upload request.
- Cloud mode cannot start without consent and a retention choice.
- Server rejects missing/invalid consent, unauthenticated access, oversized files, and unsupported types.
- Auto-delete removes temporary source, intermediate, and output files after delivery according to the documented lifecycle.
- Save-to-account stores only the chosen output and enforces account ownership.
- Failure, timeout, and cancellation paths trigger cleanup.

### 9.3 UI and regression
- Existing open, render, zoom, thumbnails, undo/redo, OCR, scanner, merge, split, image insertion, and page actions remain functional.
- No visible tool is a dead button.
- Test current Android Chrome and desktop browsers.
- Verify keyboard navigation, focus states, and responsive layouts.
- Run automated checks and manual smoke tests before deployment.

## 10. Delivery sequence

1. Audit current code and establish baseline regression tests.
2. Stabilize document model, local operation modules, and error handling.
3. Complete local document operations and editing/markup.
4. Complete OCR, scanning, conversion, and security controls with explicit capability boundaries.
5. Implement cloud backend and lifecycle; enable cloud UI only after end-to-end verification.
6. Run functional, privacy, and regression acceptance tests.
7. Redesign the interface and run responsive/accessibility regression tests.
8. Deploy and verify production workflows.

## 11. Out of scope for this specification

- Exact Adobe Acrobat cloning or use of Adobe proprietary assets.
- Guaranteed perfect reconstruction of every PDF into Word/Excel.
- Certificate-backed digital signatures, identity verification, or legal certification.
- Unlimited file sizes or unlimited cloud processing.
- Public sharing links unless separately designed with access controls.
- Billing/subscription features unless separately specified.

## 12. Definition of done

The project is complete only when the supported core tools work end-to-end, Local and Cloud modes behave exactly as disclosed, cloud consent and retention are enforced server-side, security/privacy tests pass, the professional responsive interface is deployed, and the production site is smoke-tested. A design document or visible button alone does not count as implementation.
