# KAGZI India Government Information Hub — Design Specification

## Goal
Build a mobile-first Hindi/English public information directory for Central Government, all 28 states and all 8 Union Territories. KAGZI is independent and is not a government department, recruitment agency, or application authority.

## Main sections and information architecture
1. **My Government Jobs** — Central recruitment plus dedicated pages for each state and UT; each page has search and filters for department, post, qualification, status, and keyword.
2. **Sarkari Yojana** — Central and state/UT scheme directory, with search by scheme, department, beneficiary group, and state.
3. **Government Documents & Citizen Services** — document/certificate guidance, process, required documents, fees when officially stated, and official application/service links.
4. **Job Alerts & Government Updates** — new notices, application deadlines, exam/admit-card/result updates, scheme changes, and document/service rule changes.

Every section and state/UT page must have a clear local search. Central Government content is separate from state/UT content. Do not create empty pages that imply a live directory exists; clearly label sections as being built until verified content is available.

## Recruitment and service record fields
Use only fields supported by a source:
- Region: Central / named state / named UT
- Department or recruiting agency
- Scheme, service, document, recruitment, or alert title
- Summary and eligibility/qualification where officially stated
- Important dates, fee, status, and benefit details where officially stated
- Official notice/source URL and official application URL
- Source publisher, source type, permission/license evidence, checked-at timestamp
- Verification state: verified / needs recheck / expired / withheld
- Last changed timestamp and a short change summary

Never invent vacancies, deadlines, eligibility, benefits, fees, salaries, or links. Expired notices must be marked expired or excluded from active results.

## Automatic monitoring and publishing policy
The system may monitor official sources on a scheduled basis. Automatic publication is permitted ONLY when the source registry records clear permission for the specific automated use and republication method.

Allowed source classes require documented terms such as an API licence, RSS reuse terms, Open Government Data licence, or explicit written permission that covers the intended use. Being a government website or publicly viewable does NOT by itself establish permission to copy or republish its content.

For each source, store:
- Exact source URL and publisher/department
- Source type (API, RSS, open-data catalogue, official notice page)
- Applicable licence/terms URL and permission scope
- Whether automated retrieval, summarisation, translation, caching, and republication are allowed
- Attribution requirements, update frequency limits, and any expiry/review date
- Last successful check and last permission review

Automatic publish gate:
1. Confirm the source is on the approved-source registry and permission is current for the intended use.
2. Fetch within the source's stated technical and rate limits.
3. Detect changes and compare with the previously stored source version.
4. Extract only fields supported by the source; preserve attribution and link to the original.
5. Validate dates, destination URLs, region, and duplicate status.
6. Publish only if all checks pass and no material conflict or ambiguity exists.
7. Store a change log, source snapshot/reference, publication timestamp, and rollback version.

If permission is absent, unclear, expired, or does not cover republication, do NOT copy or republish the source's text/data. KAGZI may show a minimal title/link only where linking is permitted and must send the visitor to the original official page. If even automated retrieval or linking is restricted, do not ingest it.

If a notice is ambiguous, conflicting, malformed, stale, or cannot be reliably parsed, withhold automatic publication and label it for manual verification. The system must never invent missing facts. Do not describe a notice as verified merely because its domain appears official.

## Alerts
- Show new and changed items in a dated update feed.
- Label alert type (new recruitment, deadline, exam, result, scheme change, document/service change).
- Include source and last-checked date.
- Do not promise push notifications unless a consent-based notification channel is actually implemented.
- Visitors can share an alert but KAGZI must not send messages without their explicit action.

## Sharing and KAGZI promotion
- Each job, scheme, document/service, and alert card has a **Share** action.
- On supported devices use the native share sheet; otherwise copy a prepared message.
- A separate **WhatsApp Share** action opens WhatsApp with a prepared message; it must never send automatically.
- Each prepared message includes the item title, original official source link (when permitted), the relevant KAGZI section/state page URL, and the KAGZI homepage URL: https://kagzi-8cy.pages.dev/
- Each section landing page and state/UT page also has **Share KAGZI** and **WhatsApp Share** actions containing that page URL and the KAGZI homepage URL.
- Include Hindi/English share text where practical. Keep links intact and visible.

## Search, mobile UX, and accessibility
- Hindi and English search terms where available.
- Combined filters, clear/reset action, useful no-results state, and visible source/updated date.
- Accessible labels, keyboard focus, readable contrast, and Android-sized responsive layouts.

## Privacy and safety
- Do not collect Aadhaar numbers, OTPs, passwords, bank details, or recruitment portal credentials.
- Do not proxy or submit applications on behalf of visitors.
- Display a clear disclaimer that KAGZI is independent; users must read the original official notice and confirm current details before applying or relying on scheme/service guidance.
- Store only the minimum technical data needed for monitoring, provenance, and rollback.

## Delivery and verification
- Implement on a feature branch associated with PR #41; never merge or publish to production without explicit user approval.
- Build and test one representative Central page and state/UT templates before generating all regional pages.
- Test source permission gates, scheduled change detection, duplicate handling, failed fetches, rollback, search/filter combinations, native share fallback, WhatsApp message content, and mobile layout.
- Populate the approved-source registry only after each source's actual terms are reviewed. Do not claim nationwide coverage or automatic publication is complete until source coverage and permission have been verified.
