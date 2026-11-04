# KAGZI Document Workspace — Design
Date: 2026-11-05
Status: Proposed; awaiting user review before implementation

## 1. Goal
Turn the existing Document Library page into a useful, mobile-first workspace for real documents. Keep the current KAGZI dashboard and other tools stable. Prefer existing Supabase configuration and current project patterns; do not introduce paid services.

## 2. Current-state findings
- `document-library.html` currently renders six hard-coded sample cards. They are not downloadable document files.
- The page already contains a PDF picker, local preview dialog, Supabase sign-in check, upload attempt, database listing, and signed-URL reading.
- The current upload path writes to the `kagzi-private` Storage bucket and inserts metadata into `kagzi_documents`.
- The page assumes that the bucket, table, columns, owner-based RLS policies, and Storage policies exist and are correctly configured. Their live state and policies have not yet been verified.
- The page currently lists uploaded documents with a Read action, but does not yet provide a complete file-management workflow.
- `auth-guard.js` protects this page behind KAGZI login. The shared public client configuration is in `config.js`.

## 3. Approaches considered
1. **Local-only library:** simplest and avoids cloud configuration, but files stay on one browser/device and do not meet the existing account-library expectation.
2. **Private cloud library:** upload PDFs to the user's private account folder and manage them through Supabase. Best fit for the existing implementation and cross-device access.
3. **Combined workspace (recommended):** private cloud library plus a clearly separated catalogue of real KAGZI government/education resources that link to their actual pages or files. This avoids presenting placeholder cards as downloadable documents while keeping useful discovery in one place.

## 4. Recommended experience
### Main page
- Keep the current KAGZI visual identity and responsive layout.
- Separate two areas with clear labels: **My Documents** (user-owned uploads) and **KAGZI Resources** (published resources).
- Provide search by filename/title and category filters.
- Show meaningful empty, loading, signed-out, and error states. Never show sample entries as if they were real files.
- Keep upload action explicit; selecting or previewing a file must not upload it automatically.

### My Documents
- Accept PDF files only in the first release.
- Validate MIME type/extension and the configured storage size limit before upload.
- Display filename, size, upload date, and available actions.
- Support preview/read, download, and delete for the signed-in owner's files.
- Ask for confirmation before deletion; remove the Storage object and metadata safely, with recoverable error handling for partial failures.
- Use short-lived signed URLs for private reads/downloads; never expose permanent public URLs.
- Enforce owner-scoped access in database and Storage policies, not only in front-end code.

### KAGZI Resources
- Populate only from verified existing KAGZI resource records/pages.
- Each item must have a real destination and a truthful title/category.
- If no verified resource exists for a category, show an honest empty state rather than fabricated sample documents.

## 5. Data and security boundaries
- Reuse the configured Supabase project and publishable browser key. Never place a service-role/secret key in client code.
- Before implementation, inspect the actual `kagzi_documents` schema, `kagzi-private` bucket configuration, RLS policies, and Storage object policies.
- Required ownership invariant: authenticated user ID must match the owner ID and the first path segment of the Storage object for every read, insert, and delete.
- Verify row-level access for unauthenticated users and for a second test account; one account must not read, list, download, or delete another account's documents.
- Do not log document contents, signed URLs, access tokens, or sensitive metadata.
- Do not promise a 50 MB maximum or unlimited/free storage until the actual project limits and bucket configuration have been checked.

## 6. Error handling and accessibility
- Explain common errors in plain Hindi/English: login required, unsupported file, file too large, upload failed, library unavailable, preview unavailable, and delete failed.
- Keep buttons keyboard accessible, label file inputs, announce status updates, and provide visible focus states.
- Disable duplicate upload/delete actions while a request is in progress.
- Preserve the original local file; cloud actions operate on the selected file copy.

## 7. Implementation sequence
1. Inspect live Supabase schema, bucket, limits, and policies; record findings before changing data or policies.
2. Add/adjust automated tests for real-vs-placeholder catalogue content, upload validation, owner scoping, listing, preview/download, deletion, and error states.
3. Implement the combined workspace in focused changes, reusing existing client configuration.
4. Run automated audits and JavaScript checks; inspect desktop and Android-sized layouts.
5. Deploy a preview first. Do not publish to production until the user reviews the preview and explicitly approves.

## 8. Acceptance criteria
- No placeholder/sample cards are presented as real documents.
- A signed-in user can upload a valid PDF, see it in My Documents, preview/read it, download it, and delete it.
- A signed-out visitor is redirected to login and sees no private file data.
- Cross-account access is denied by backend policies, not merely hidden in the UI.
- Upload size/type errors and network/backend failures are understandable and do not leave misleading success messages.
- Verified KAGZI resources have working destinations; missing resources are not invented.
- The page works without horizontal overflow at 360–390 px viewport widths.
- Existing dashboard navigation and other KAGZI tools continue to pass their regression checks.
- Production remains unchanged until preview review and explicit release approval.

## 9. Out of scope for the first release
- Public sharing links, collaborative folders, OCR, AI summarisation, document editing, bulk upload, and non-PDF file types.
- Any paid API/service or promise of unlimited storage.
