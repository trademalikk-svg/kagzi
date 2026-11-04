Plan: docs/plans/2026-11-05-document-workspace.md

Task 1: in_progress — Added tests/document-library-audit.mjs and .github/workflows/document-workspace-checks.yml on feature/document-workspace. The test runner has not yet reported a run; local execution is blocked because the container cannot resolve github.com. GitHub Actions currently returns no workflow runs for the branch. Do not mark tests passing.

Task 2: in_progress — Read-only Supabase security/performance audit completed. Confirmed RLS enabled on KAGZI workspace tables; both Storage buckets are private; kagzi-private object policies constrain authenticated access to the caller's UID path prefix; published kagzi-library files have an explicit published-only read policy. No schema or policy changes made.

Findings:
- Security Advisor: leaked-password protection disabled (WARN). Supabase documentation says this Auth feature is available on Pro and above; current project is Free, so this cannot be enabled through the current plan.
- Performance Advisor: duplicate permissive policies on kagzi_documents for SELECT/INSERT/DELETE (owner predicates are equivalent); 7 RLS initplan warnings; 4 unindexed foreign keys; 6 unused indexes. Do not remove or alter policies/indexes without a reviewed migration and regression tests.
- Static public-client config contains a Supabase publishable key (sb_publishable_...), not a secret/service-role key.
- Preview fetch confirms homepage currently has mismatched Open Graph title/description relative to Jan Seva & Education content. sitemap.xml currently lists 6 URLs and omits document-library.html; canonical and sitemap use the production host by design.
- document-library.html currently contains hard-coded sample cards and does not yet query kagzi_library_files; upload/read listing exists but delete/download lifecycle and full resource catalogue are incomplete.
- Preview document-library route correctly redirects signed-out visitors to login; authenticated owner-isolation flows remain untested.

Task 3: not_started — Full workspace implementation and interaction tests remain.
Task 4: in_progress — Preview deployment for commit d7f0aec5d6a8b8295f20ef2d9cb1493a7f352773 succeeded at https://bc40a5ea.kagzi-8cy.pages.dev. Automated GitHub Actions results and authenticated browser tests are still pending. Production branch main has not been changed.
