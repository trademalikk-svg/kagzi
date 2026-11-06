# KAGZI India Government Information Hub Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend KAGZI into a searchable India-wide directory for government jobs, schemes, documents and alerts, with permission-gated automatic updates and explicit Share/WhatsApp sharing.

**Architecture:** Preserve the existing static HTML/CSS/vanilla-JavaScript Cloudflare Pages site for visitor pages. Add shared regional directory templates and structured content records, then add a separate scheduled ingestion service that only publishes records from a source registry with documented permission for the exact automated use. Keep production unchanged; all work remains on PR #41's feature branch until reviewed and explicitly approved.

**Tech Stack:** Existing HTML, CSS and vanilla JavaScript; existing Cloudflare Pages project; proposed Cloudflare Worker scheduled trigger and persistent store for source registry/change history (provider and bindings must be confirmed before implementation). Existing repository documentation indicates no root `package.json` or standard test runner; use the repository's existing static/manual checks and add focused Node built-in test scripts only if Node is available in the CI environment.

## Global Constraints

- Cover Central Government, all 28 states and all 8 Union Territories.
- Each state/UT gets a dedicated landing page; Central Government remains separate.
- Jobs, schemes, documents/citizen services, and alerts each have their own search and filters.
- Use only official sources as authoritative destinations. Never invent vacancies, deadlines, eligibility, benefits, fees, salaries, or links.
- Public visibility on a government website does not itself grant permission to scrape, copy, translate, cache, or republish its content.
- Automatic publication is allowed only when the source registry contains current evidence that the exact API/RSS/open-data/notice use and republication are permitted. Otherwise do not republish content; where linking is permitted, show a minimal title and link to the official source.
- Withhold ambiguous, conflicting, malformed, stale, or unparseable changes for manual verification. Never label an item verified solely because its domain looks official.
- Keep source URL, publisher, terms/licence URL, permitted use, attribution requirements, checked-at time, change history, and rollback reference.
- Every shared message includes the item title, permitted official source link, relevant KAGZI section/state page, and KAGZI homepage: https://kagzi-8cy.pages.dev/.
- Native Share and WhatsApp Share are separate explicit visitor actions. Never send a message automatically.
- Do not collect Aadhaar, OTPs, passwords, bank details, or government portal credentials.
- KAGZI must clearly disclose that it is independent and visitors must verify details in the original official notice/portal.
- Implement only on the PR #41 feature branch. Do not merge or publish production without explicit approval.

---

### Task 1: Add the India-wide directory shell and regional page structure

**Files:**
- Modify: `all-india.html`
- Modify: `index.html` (existing India Services entry point only)
- Create: `government-jobs/index.html`
- Create: `government-jobs/central/index.html`
- Create: `government-jobs/states/index.html` (state/UT selector directory)
- Create: `government-jobs/assets/jobs-directory.js`
- Create: `government-jobs/assets/jobs-directory.css`
- Create: `government-schemes/index.html`
- Create: `government-documents/index.html`
- Create: `government-updates/index.html`
- Test: `tests/government-directory.test.mjs` (proposed; use Node built-in test/assert modules, no third-party dependency)

**Interfaces:**
- `window.KagziDirectory.init({ root, records, region, category })` renders a directory from structured records and binds local search/filter controls.
- Region identifiers use stable URL slugs; the state/UT directory lists all 28 states and 8 UTs.
- Directory records expose `id`, `region`, `category`, `title`, `department`, `summary`, `officialUrl`, `notificationUrl`, `applicationUrl`, `updatedAt`, and `verificationStatus`; optional fields remain optional and are displayed only when sourced.

- [ ] **Step 1: Add focused failing tests**
  - Assert the region registry contains exactly 28 states and 8 UTs with unique slugs.
  - Assert central government is a separate region and each section exposes its own search input and clear action.
  - Assert search matches title and department and combined region/category/status filters narrow results without hiding unrelated sections.
  - Assert missing optional fields do not render fabricated placeholder facts or broken links.
- [ ] **Step 2: Verify the relevant failure**
  - Run: `node --test tests/government-directory.test.mjs`
  - Expected: tests fail because the directory registry, shared renderer, and section pages do not yet exist.
- [ ] **Step 3: Implement the minimum directory structure**
  - Preserve current `all-india.html` links and existing Jan Seva routes.
  - Add section landing pages and a complete state/UT selector.
  - Add reusable page templates driven by structured data; create dedicated regional URLs from the approved state/UT slug registry.
  - Provide Hindi/English labels, mobile layouts, source links, status labels, and no-results/reset states.
  - Keep unpopulated regions clearly labelled as awaiting verified listings; do not imply that vacancy/scheme coverage is already complete.
- [ ] **Step 4: Verify the focused pass**
  - Run: `node --test tests/government-directory.test.mjs`
  - Expected: all directory registry, search/filter, optional-field, and route tests pass.
- [ ] **Step 5: Run integration checks**
  - Open `all-india.html`, Jobs, Schemes, Documents, Updates, Central Jobs, and representative state/UT pages at desktop and Android-width viewports.
  - Expected: all internal links resolve, each section's search works independently, and existing homepage/Jan Seva navigation remains intact.
- [ ] **Step 6: Commit the passing deliverable**
  - `git add all-india.html index.html government-jobs government-schemes government-documents government-updates tests/government-directory.test.mjs`
  - `git commit -m "feat: add India-wide government directory sections"`

### Task 2: Implement explicit sharing across all directory cards and pages

**Files:**
- Create: `shared/kagzi-share.js`
- Create: `tests/kagzi-share.test.mjs` (proposed; Node built-in test/assert)
- Modify: `government-jobs/assets/jobs-directory.js`
- Modify: `government-jobs/index.html`
- Modify: `government-schemes/index.html`
- Modify: `government-documents/index.html`
- Modify: `government-updates/index.html`
- Modify: regional page template from Task 1

**Interfaces:**
- `KagziShare.buildMessage({ title, officialUrl, pageUrl, homeUrl, language })` returns a prepared text message with the item, source (when permitted), current KAGZI page, and homepage.
- `KagziShare.share({ title, message, url })` invokes `navigator.share` when available; cancellation does not trigger an unwanted clipboard fallback; unsupported/error cases offer copy fallback.
- `KagziShare.whatsappUrl(message)` returns a `https://wa.me/?text=` URL with correctly encoded message text.
- Page-level controls use the actual current page URL; item-level controls use the item anchor/permalink.

- [ ] **Step 1: Add focused failing tests**
  - Assert messages contain the title, permitted official URL, relevant page URL, and KAGZI homepage URL.
  - Assert missing/withheld official URLs are omitted without producing `undefined` text.
  - Assert Hindi and English messages preserve URL integrity and WhatsApp encoding round-trips correctly.
  - Assert no code path sends a message automatically.
- [ ] **Step 2: Verify the relevant failure**
  - Run: `node --test tests/kagzi-share.test.mjs`
  - Expected: tests fail because the shared helper and consistent actions do not exist.
- [ ] **Step 3: Implement sharing**
  - Add distinct Share and WhatsApp Share actions to job, scheme, document/service, and alert cards.
  - Add Share KAGZI and WhatsApp Share to each section and state/UT page.
  - Native share uses the visitor's system share sheet; clipboard/prompt is the fallback; WhatsApp opens a prefilled compose screen for visitor confirmation.
  - Keep both the specific KAGZI page and homepage link in every prepared message.
- [ ] **Step 4: Verify the focused pass**
  - Run: `node --test tests/kagzi-share.test.mjs`
  - Expected: all message composition, URL encoding, and fallback tests pass.
- [ ] **Step 5: Run integration checks**
  - On Android Chrome, test native share, clipboard fallback, WhatsApp compose, cancel behaviour, and page/card sharing.
  - Expected: each control remains separate and every prepared message contains both KAGZI links.
- [ ] **Step 6: Commit the passing deliverable**
  - `git add shared/kagzi-share.js tests/kagzi-share.test.mjs government-jobs government-schemes government-documents government-updates`
  - `git commit -m "feat: add KAGZI and WhatsApp sharing to directories"`

### Task 3: Add source permission registry and safe scheduled update pipeline

**Files:**
- Create: `workers/gov-updates/src/index.js` (proposed Cloudflare Worker entry point)
- Create: `workers/gov-updates/src/source-registry.js`
- Create: `workers/gov-updates/src/ingest.js`
- Create: `workers/gov-updates/src/publish.js`
- Create: `workers/gov-updates/schema.sql`
- Create: `workers/gov-updates/wrangler.toml` (proposed; bindings/secrets configured only after account project confirmation)
- Create: `tests/gov-updates.test.mjs`
- Modify: `government-updates/index.html` (read published update feed)
- Modify: `government-jobs/assets/jobs-directory.js` (consume published records only; no direct scraping in browser)

**Interfaces:**
- `getApprovedSources(store, now)` returns only source records whose permission evidence is current and whose allowed-use flags cover the planned retrieval and publication.
- `checkSource(source, fetcher, now)` fetches only supported API/RSS/open-data formats and obeys source-specific request limits.
- `detectChanges(previousSnapshot, currentSnapshot)` produces a structured change candidate with source provenance.
- `validateCandidate(candidate, sourcePolicy)` returns publishable or withheld plus exact reasons.
- `publishCandidate(candidate, store)` stores an immutable version and publishes only candidates that pass every gate.
- Scheduled handler runs the approved source checks; a manual admin recheck can be added only if an authenticated operator boundary exists.

- [ ] **Step 1: Add focused failing tests**
  - Approved API/RSS/open-data source with current permission can be checked within configured rate limits.
  - Publicly visible but permission-unknown source is not fetched for republication.
  - Permission expired, permission scope insufficient, or attribution missing causes withholding.
  - Duplicate unchanged source version does not create a duplicate alert.
  - Malformed date/link, conflicting values, stale source, failed fetch, or parser ambiguity withholds publication and records a reason.
  - A valid permitted change stores source provenance, checked-at timestamp, previous version, and rollback reference.
  - A failed scheduled run leaves the previously published version untouched.
- [ ] **Step 2: Verify the relevant failure**
  - Run: `node --test tests/gov-updates.test.mjs`
  - Expected: tests fail because there is no source registry, scheduled handler, or permission-gated publisher.
- [ ] **Step 3: Implement the pipeline**
  - Define source registry schema with exact source URL, publisher, source type, terms/licence URL, permission evidence, permitted retrieval/republication/translation/caching scopes, attribution, rate limits, review date, and last checked time.
  - Implement only documented and permissioned source adapters; do not use generic scraping as a fallback.
  - Compare normalized source snapshots and create candidates only for real changes.
  - Publish atomically only after all permission, provenance, data-integrity, freshness, URL, duplicate, and attribution checks pass.
  - Persist version history and rollback state. Do not overwrite last known-good published content on any failed check.
  - Keep credentials in Worker secrets; never commit tokens or account secrets.
- [ ] **Step 4: Verify the focused pass**
  - Run: `node --test tests/gov-updates.test.mjs`
  - Expected: all permission-gate, duplicate, withholding, failure-isolation, and rollback tests pass.
- [ ] **Step 5: Run integration checks**
  - Run a dry-run against fixture sources only; then verify a single real source only after its exact permission terms are reviewed and recorded.
  - Expected: no live source is auto-published without a matching approved registry entry; the updates page renders provenance and last-checked time.
- [ ] **Step 6: Commit the passing deliverable**
  - `git add workers/gov-updates tests/gov-updates.test.mjs government-updates government-jobs/assets/jobs-directory.js`
  - `git commit -m "feat: add permission-gated government update pipeline"`

### Task 4: Connect scheduled updates, alerts, verification and release safeguards

**Files:**
- Modify: `workers/gov-updates/wrangler.toml`
- Modify: `workers/gov-updates/src/index.js`
- Modify: `workers/gov-updates/src/publish.js`
- Create: `workers/gov-updates/src/alerts.js`
- Create: `tests/gov-alerts.test.mjs`
- Modify: `government-updates/index.html`
- Modify: `government-jobs/index.html`
- Modify: `government-schemes/index.html`
- Modify: `government-documents/index.html`

**Interfaces:**
- Scheduled trigger invokes the source registry pipeline at the configured cadence, but only after source-specific rate limits and terms are applied.
- `buildAlerts(changes)` creates typed alerts for recruitment, deadline, exam/admit card, result, scheme change, and document/service change.
- `getPublishedFeed({ region, category, since })` returns published and attributed records only; withheld candidates are never returned to public pages.
- Rollback operation restores the last known-good version and records who/when/reason.

- [ ] **Step 1: Add focused failing tests**
  - Each supported change type produces one dated alert with source and checked-at timestamp.
  - Duplicate changes do not create repeated alerts.
  - Expired recruitment notices are labelled expired and excluded from active jobs filters.
  - Withheld changes never appear in public feeds.
  - Rollback restores the previous published content and marks the correction in the change history.
  - Schedule failure does not erase existing alerts or published content.
- [ ] **Step 2: Verify the relevant failure**
  - Run: `node --test tests/gov-alerts.test.mjs`
  - Expected: tests fail because alert classification, feed filtering, and rollback are not implemented.
- [ ] **Step 3: Implement alerts and schedule**
  - Configure the scheduled trigger only after the Cloudflare Worker account, persistent store, and required bindings are confirmed.
  - Add dated alert feed with category/region search, source links, and last-checked labels.
  - Connect jobs/schemes/documents pages to the published feed; keep each page useful when the feed is empty or unavailable.
  - Add a safe rollback path and visible correction history.
  - Keep push notifications out of scope until a consent-based notification channel exists; on-site alerts remain available.
- [ ] **Step 4: Verify the focused pass**
  - Run: `node --test tests/gov-alerts.test.mjs`
  - Expected: alert classification, deduplication, expiry, withheld-feed, and rollback tests pass.
- [ ] **Step 5: Run full integration and release checks**
  - Run: `node --test tests/government-directory.test.mjs tests/kagzi-share.test.mjs tests/gov-updates.test.mjs tests/gov-alerts.test.mjs`
  - Expected: all four test suites pass.
  - Run the repository's existing KAGZI static/CI checks; verify PR preview deployment and Android Chrome flows. Production `main` must remain unchanged.
- [ ] **Step 6: Commit the passing deliverable**
  - `git add workers/gov-updates government-updates government-jobs government-schemes government-documents tests`
  - `git commit -m "feat: publish verified government alerts and updates"`

---

## Unresolved product and deployment decisions

1. **Persistent store and deployment binding:** The repository evidence confirms static HTML/CSS/vanilla JS and Cloudflare Pages, but does not yet establish a configured scheduled Worker or database binding. Recommended next check: confirm whether the KAGZI Cloudflare account has an existing Worker/D1/KV resource suitable for this feed. Until confirmed, keep the update pipeline in dry-run mode and do not claim automatic updates are active.
2. **Source permissions:** No approved-source inventory has yet been verified. Each source must be reviewed individually for automated retrieval and republication rights before entering the production registry; no assumption that all government pages allow reuse.
3. **Update cadence:** Choose a conservative default per source based on its published terms/rate limits; do not apply one global polling rate to every source.
4. **Public alert delivery:** This plan implements on-site alerts. Browser push/email/WhatsApp notifications require separate opt-in, provider setup, and privacy review and are not implied by the current Share/WhatsApp compose buttons.
5. **State-specific record coverage:** Regional pages can be generated from the complete state/UT registry, but live vacancy and scheme coverage depends on verified official sources and permitted records; no completeness claim until measured.
