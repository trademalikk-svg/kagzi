# KAGZI PDF Editor — Design Specification

**Date:** 2026-11-05  
**Status:** Proposed; awaiting user review  
**Reference:** Sejda PDF Editor (feature inspiration only; KAGZI will use its own UI, copy, and implementation).

## 1. Goal

Add a KAGZI-branded online PDF editor and document workspace that supports common PDF editing and page operations on mobile and desktop. Use both client-side browser processing and optional server-side processing, selecting the appropriate route per operation and file size. The user must be told when a file will leave the browser and must explicitly choose server processing.

## 2. User experience

- Add a clearly named **PDF Editor** entry to KAGZI's existing tools/navigation.
- Provide a responsive editor workspace: file picker/drop zone, document preview, page thumbnails, editing toolbar, contextual properties, undo/redo where supported, progress, and export/download.
- Keep the interface Hindi/English friendly and consistent with KAGZI's current visual system.
- Show capability and file-size limits before processing; give useful errors for unsupported, encrypted, damaged, or oversized PDFs.
- Never silently upload a user's document. Browser processing is the default. Server processing requires an explicit user action and clear notice.

## 3. Feature scope

### Initial browser-based capabilities
- Open and render PDF pages with page navigation and zoom.
- Add text boxes, images, links, highlights, simple shapes, and signature marks as PDF overlays.
- Whiteout/redaction-style visual cover is clearly labelled as a visual overlay only; do not claim secure removal of underlying text. Secure redaction is out of scope until a vetted server-side implementation can permanently remove content and verify output.
- Reorder, rotate, and delete pages; export edited PDF.
- Merge and split PDFs, subject to browser memory and file-size limits.
- Download results locally.

### Optional server-assisted capabilities
- Process larger files and operations that exceed safe browser memory limits.
- Offer server-assisted compression and conversions only when a vetted processor is configured.
- Clearly disclose upload, retention period, and deletion behavior before upload. Default to short-lived temporary storage and automatic deletion; do not store document contents in user analytics or logs.
- If no server processor is configured, disable these actions with a clear explanation rather than displaying fake success.

### Explicitly out of scope for first release
- Full Word-like editing of arbitrary existing PDF text. Existing text replacement is not reliably equivalent to editing a source document; initial release focuses on overlays and page operations.
- OCR-based text reconstruction, collaborative editing, accounts/document cloud library, payments, and batch automation.
- Secure redaction until verified permanent sanitization is implemented.

## 4. Architecture

### Frontend
- Add a dedicated editor page and focused JavaScript modules rather than expanding the homepage's inline scripts.
- Use PDF.js for rendering and page preview.
- Use a PDF manipulation library such as pdf-lib for client-side overlays and page operations, after checking current browser compatibility, bundle size, and license.
- Keep file bytes in browser memory for the local path; do not send them to analytics or third-party services.
- Use lazy loading and page virtualization/thumbnails so mobile devices are not forced to render every page at once.

### Processing router
- Each operation declares whether it is supported locally, server-side, or both, plus a conservative local size/page threshold.
- Default to local processing. When a file exceeds local limits, explain the reason and offer server processing only if the backend is configured.
- If a local operation fails due to memory or unsupported features, preserve the original file and offer a safe retry route.

### Backend
- Use a dedicated server endpoint/worker only for operations that genuinely need it.
- Validate MIME type and file signature, enforce request and page limits, generate random temporary object names, and isolate each job.
- Store temporary input/output outside public paths; restrict access; expire and delete temporary files automatically.
- Never accept executable content or trust client-provided filenames/metadata.
- Do not log document bytes or extracted text. Log only minimal operational metadata and a job identifier.
- Configure explicit limits and error responses. Backend processing remains unavailable until a real processor and storage lifecycle are configured.

## 5. Data flow

1. User selects a PDF; validate type/signature and basic size locally.
2. Render preview in the browser.
3. User edits or chooses a page operation.
4. Browser path processes locally and downloads output.
5. If local processing is unsuitable, show a clear explanation and ask the user to opt in to server processing.
6. Server path uploads to a temporary private job, processes it, returns a download, and deletes temporary input/output according to the disclosed retention policy.
7. If processing fails, preserve the source and show a retryable error; never claim an export succeeded unless a valid output file was produced.

## 6. Quality, privacy, and accessibility
- Responsive layout with touch-friendly controls and keyboard-accessible actions.
- Hindi/English labels and understandable error messages.
- Test valid, malformed, encrypted, large, and multi-page PDFs; test phone-sized viewports.
- Verify output opens in independent PDF viewers and preserves page count/order/orientation as expected.
- Verify no network request contains file bytes during browser-only workflows.
- Verify server upload occurs only after explicit opt-in and that temporary objects are deleted.
- Do not advertise secure redaction, guaranteed compression, or full existing-text editing until each is independently tested.

## 7. Rollout sequence
1. Build the responsive editor shell and browser rendering.
2. Add browser overlays and page operations, with export.
3. Add merge/split and robust validation.
4. Add server-assisted processing only after processor, storage, privacy notice, limits, and cleanup are configured.
5. Add tests and audit mobile usability, privacy behavior, and output correctness.
6. Publish through a reviewed pull request and verify the Cloudflare Pages deployment.

## 8. Success criteria
- A user can open a PDF on mobile or desktop, preview it, add text/image/annotation overlays, reorder/rotate/delete pages, export, and download a valid PDF without uploading the file.
- Server processing is clearly optional, explicitly consented to, and unavailable until its backend safeguards are working.
- Errors preserve the original document and do not show false completion.
- KAGZI's existing pages and tools continue to work.

## 9. Decisions requiring user review
- Confirm that initial existing-text editing means overlay-based editing, not arbitrary rewriting of the PDF's original text.
- Confirm that secure redaction is deferred until permanent removal can be verified.
- Confirm browser-first processing with optional, consent-based server processing.
