# KAGZI Document Workspace Implementation Plan

> **For agentic workers:** Use the host's task-by-task implementation workflow. Steps use checkbox syntax.

**Goal:** Build a real mobile-first workspace for private user PDFs and verified KAGZI resources.

**Architecture:** Preserve the static HTML application and existing Supabase client. Use `kagzi_documents` and private `kagzi-private` for user files; use published `kagzi_library_files` records and `kagzi-library` for KAGZI resources. Keep backend owner policies, use expiring signed URLs, and deploy a preview before release.

**Tech Stack:** HTML, CSS, browser JavaScript, Supabase JS v2, Postgres RLS, Storage, Node built-in test runner, GitHub, Cloudflare Pages.

## Global Constraints
- Keep the dashboard and other tools stable.
- No paid services or secret keys in browser code.
- PDF only; selecting or previewing never uploads automatically.
- Private file access must be enforced by backend policies.
- Never display sample cards as real files or invent resource destinations.
- No public sharing, OCR, AI summaries, editing, bulk upload, folders, or non-PDF types in this release.
- Production remains unchanged until the user reviews and explicitly approves the preview.

---

### Task 1: Define automated acceptance tests

**Files:** Create `tests/document-library-audit.mjs`; update `tests/mobile-acceptance.md`.

**Interfaces:** Read `document-library.html`; assert the existing IDs and Supabase integration remain usable.

- [ ] Add Node built-in tests for: no hard-coded sample documents; distinct My Documents and KAGZI Resources sections; explicit loading, signed-out, empty, and error states; PDF-only upload; preview separate from upload; read/download/delete controls; confirmation before deletion; published-only resource catalogue.
- [ ] Run `node --test tests/document-library-audit.mjs`.
- [ ] Expected: initial failures identify the current missing UI and sample-card behavior.
- [ ] Run `node --test tests/dashboard-audit.mjs tests/studio-ui-audit.mjs tests/education-library-audit.mjs`; existing audits must pass.
- [ ] Commit: `git add tests/document-library-audit.mjs tests/mobile-acceptance.md && git commit -m "test: define document workspace acceptance"`.

### Task 2: Verify and test private file lifecycle

**Files:** Create `tests/document-library-storage-audit.mjs`; modify `document-library.html` only where needed; create a migration only if inspection proves a database change necessary.

**Interfaces:** Existing `kagzi_documents(id, owner_id, folder_id, file_name, mime_type, size_bytes, storage_path, source, uploaded_at, expires_at)`; private bucket `kagzi-private`; existing public client configuration.

- [ ] Add tests for owner-scoped metadata, user-ID storage path prefix, private object access, upload rollback on metadata failure, and delete partial-failure reporting.
- [ ] Recheck Supabase schema, policies, bucket configuration, and security advisors before changes.
- [ ] Observed configuration: RLS is enabled on `kagzi_documents`; `kagzi-private` is private with a 50 MiB object limit; Storage owner policies scope access to the first object-path segment matching the authenticated user ID. There are overlapping metadata policies; inspect before any cleanup.
- [ ] Check current official Supabase changelog and Storage/RLS/signed-URL documentation before any schema or policy change.
- [ ] Preserve policies if they already satisfy ownership. If not, make the smallest migration with owner checks for table rows and bucket/path checks for Storage objects. Do not make buckets public.
- [ ] Run `node --test tests/document-library-storage-audit.mjs` and Supabase security advisors; no new security findings may be introduced.
- [ ] Commit passing changes only: `git add tests/document-library-storage-audit.mjs document-library.html supabase/migrations && git commit -m "fix: enforce private document lifecycle"` (stage migration directory only if a migration was created).

### Task 3: Build the combined workspace

**Files:** Modify `document-library.html`; create `tests/document-library-interactions.mjs`; update `tests/mobile-acceptance.md`.

**Interfaces:** Existing `window.KAGZI_CONFIG`, Supabase JS client, `kagzi_documents`, `kagzi-private`, `kagzi_library_files`, and `kagzi-library`.

- [ ] Add failing interaction tests for signed-out state, owner-only listing, no auto-upload, empty/invalid/oversize file rejection, upload success and rollback, signed read/download, confirmed deletion, search/filter, and honest empty/error states.
- [ ] Run `node --test tests/document-library-interactions.mjs`; confirm the expected missing behavior.
- [ ] Replace sample cards with rows from `kagzi_library_files` filtered by `is_published=true`. Keep private uploads separate. Use only observed columns.
- [ ] Upload to `kagzi-private` under a path beginning with the authenticated user's ID; insert matching metadata into `kagzi_documents`. On metadata failure, attempt Storage cleanup and report failure honestly.
- [ ] Read and download with short-lived signed URLs. Delete only after confirmation; remove the exact Storage object and then the owner-filtered metadata row. Report partial completion if the second operation fails.
- [ ] Keep local PDF preview independent of cloud upload. Add touch-friendly actions, labelled controls, visible focus, and accessible live status.
- [ ] Run `node --test tests/document-library-interactions.mjs tests/document-library-audit.mjs tests/document-library-storage-audit.mjs`; all must pass.
- [ ] Run `node --test tests/dashboard-audit.mjs tests/studio-ui-audit.mjs tests/education-library-audit.mjs tests/document-library-audit.mjs tests/document-library-storage-audit.mjs tests/document-library-interactions.mjs`; all must pass.
- [ ] Commit: `git add document-library.html tests/document-library-interactions.mjs tests/document-library-audit.mjs tests/mobile-acceptance.md && git commit -m "feat: build KAGZI document workspace"`.

### Task 4: Preview and acceptance

**Files:** Update `tests/mobile-acceptance.md`.

**Interfaces:** Completed page and passing automated checks; Cloudflare Pages project `kagzi`.

- [ ] Run `node --check auth-guard.js`.
- [ ] Run all six Node audit files listed in Task 3; expect all passing.
- [ ] Deploy a feature-branch preview and record exact URL and commit SHA; do not merge to main.
- [ ] Verify 360 px, 390 px, and desktop layouts; search, filters, empty/signed-out states, local preview, upload, signed read/download, delete, second-account isolation, and dashboard/Learning Hub navigation.
- [ ] Mark Android Chrome testing pending if no real Android browser session is available.
- [ ] Recheck Supabase security advisors and relevant logs; distinguish pre-existing findings from new ones.
- [ ] Share preview and results; wait for explicit user release approval.
- [ ] Commit acceptance notes: `git add tests/mobile-acceptance.md && git commit -m "test: record document workspace release checks"`.

## Unresolved product decisions
- Confirm whether published KAGZI resource files should open using expiring signed URLs or an existing public-facing resource page. Do not make `kagzi-library` public as a shortcut.
- Map the existing resource categories only after inspecting published rows. Known categories: literature, knowledge, exam, business, current-affairs, handwritten-notes, previous-papers.
- If Storage deletion succeeds but metadata deletion fails, report partial completion and offer refresh/retry. A reconciliation job is outside this release.
