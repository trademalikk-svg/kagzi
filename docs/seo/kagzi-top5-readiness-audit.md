# KAGZI organic growth and Top-5 readiness audit

Audit date: 2026-11-07  
Property checked: `https://kagzi-8cy.pages.dev/`  
Search type: Google Web  
Reporting window: latest 28 settled days (2026-10-08 to 2026-11-04)

## Executive status

This is a readiness and measurement audit, not a ranking guarantee.

| Area | Verified status | Action |
|---|---|---|
| Google Search Console connection | Connected; property is listed | Keep using this exact URL-prefix property |
| Search performance | 0 clicks, 0 impressions, 0 CTR, average position unavailable/0 in the reported window | Collect crawl and impression data before changing titles based on performance |
| Query/page report | No rows returned | No actual search-query map can yet be populated |
| Sitemap | `/sitemap.xml` submitted 2026-11-07; pending, 0 warnings and 0 errors at last check | Recheck after Google fetches it |
| URL inspection | 15 priority URLs inspected; all returned “URL is unknown to Google”, with no last crawl time | Improve discovery and wait for crawl; inspect again |
| Ahrefs competitor data | Not available in the connected Ahrefs account because the tool returned “Insufficient plan” | Do not invent Ahrefs traffic, keyword or backlink metrics |

## 15 priority URLs inspected

- `/`
- `/jan-seva.html`
- `/jan-seva-en`
- `/document-editing-en`
- `/document-editing`
- `/education-pdfs`
- `/education-pdfs-en`
- `/pdf-tools`
- `/passport-size-photo-maker`
- `/compress-photo-to-20kb-50kb`
- `/free-pdf-merge`
- `/jpg-to-pdf`
- `/pdf-compress`
- `/study-material`
- `/current-affairs`

All 15 inspection calls succeeded, but Google currently reports each URL as unknown. An inspection request is not an indexing request and cannot force Google to index a page.

## Competitive landscape (qualitative public SERP sample)

### PDF utilities

Observed competitors and reference products include iLovePDF, Smallpdf, PDF24, Sejda, PDF Candy, PDForu, LovelyPDF and PDFConvert.in. These results show a crowded generic “free PDF tools” market. KAGZI should avoid trying to win only on a broad generic phrase.

Recommended differentiation:
1. Lead with India-specific tasks users actually need: compress a photo to a form size, prepare a passport photo, convert a phone scan to PDF, and prepare documents for online forms.
2. Explain file handling precisely on each tool page. Only say “processed locally” for tools that are verified to run locally; disclose any server-side processing separately.
3. Provide direct tool links, supported input/output formats, file/page limits where verified, mobile steps, and troubleshooting.
4. Publish original screenshots or short demonstrations from the actual KAGZI interface; do not copy competitor wording or screenshots.
5. Create helpful task guides that answer one intent each and link to the matching working tool.

### Uttar Pradesh Jan Seva

Official references surfaced include the Government of India National Government Services Portal’s Uttar Pradesh e-District entry and Uttar Pradesh district administration pages describing e-District services. KAGZI must remain a guide, not imply government affiliation or certificate issuance.

Recommended differentiation:
1. Make each service guide answer one specific task (income, caste, domicile, ration card, land record, etc.).
2. Put the official portal link prominently near the top.
3. Clearly label required documents as “check the current official portal”; do not promise fixed fees or timelines unless verified against a current official source.
4. Add “last verified” dates and source links to service pages.
5. Keep the non-government disclaimer visible.

### Education PDFs

The current page map targets UPPSC/UPSSSC/UP GK and subject-wise study resources. Generic “study material PDF” is competitive. Improve each subject page with a clear syllabus scope, contents, sample pages, update date, and transparent preview/paid access details. Never claim official affiliation, guaranteed results or complete syllabus coverage unless demonstrably true.

## Page-to-intent priorities

| Priority | Page | Primary intent | Next improvement |
|---|---|---|---|
| 1 | `/compress-photo-to-20kb-50kb` | Compress photo to 20KB/50KB for forms | Show exact steps, output-size controls and common portal errors |
| 2 | `/passport-size-photo-maker` | Passport size photo maker online | Explain dimensions, background, print/download options and limits |
| 3 | `/jan-seva.html` | UP government services in Hindi | Add dated official sources and task-specific service guides |
| 4 | `/document-editing-en` | Online document/PDF editing | State supported edits, limitations, privacy model and mobile workflow |
| 5 | `/education-pdfs` | Hindi competitive-exam study PDFs | Add contents, previews, update dates and honest coverage statements |
| 6 | `/pdf-tools` | PDF tools online | Use as a navigation hub; let individual tool pages target specific tasks |

These are strategic priorities, not proven search-volume rankings. Reorder them when Search Console has query and page data.

## Technical checks and cautions

- `robots.txt` allows public crawling and points to the submitted sitemap.
- The homepage has a canonical URL, robots directive, Open Graph metadata and Organization/WebSite/WebApplication structured data.
- Public landing pages have canonical and language-alternate metadata where checked.
- Keep private workspaces, auth/config files, test routes and account-only content out of the public sitemap.
- Review the sitemap for stale, duplicate, redirecting or non-public URLs whenever routes change.
- Do not add fake `lastmod` dates, fabricated reviews, keyword stuffing or doorway pages.
- Do not create backlinks through paid link farms or automated spam. Prefer genuine citations from relevant education, community and tool-resource sites.

## Next 30-day execution sequence

1. Recheck the submitted sitemap and inspect the 15 priority URLs after Google has had time to crawl.
2. Check every sitemap URL for HTTP 200, indexable robots directives, self-consistent canonical, and useful page content.
3. Add internal links from the homepage and relevant hubs to the six priority pages above.
4. Improve the highest-priority task pages with original screenshots, tested instructions, limitations and FAQs that reflect the actual feature.
5. Verify all official Jan Seva links and source dates; keep disclaimers visible.
6. Once impressions appear, export actual queries/pages/countries/devices. Prioritise high-impression queries with positions 5–20 and improve the matching page.
7. Review changes every 14 days; measure clicks, impressions, CTR and average position against the prior 28-day period.

## Measurement baseline

At the time of this audit, Google Search Console reported zero clicks and zero impressions for the last 28 settled days, and no query/page rows. This is a baseline, not proof that the pages are technically broken. The 15 inspected URLs were “unknown to Google” and had no recorded crawl time. Wait for crawl and re-check before claiming indexation or ranking.

## Source notes

Public SERP sample:
- Search result comparisons for free PDF tools included iLovePDF, Smallpdf, PDF24, Sejda and other Indian-focused tools.
- Government service reference: National Government Services Portal, “Uttar Pradesh e-District Services” — https://services.india.gov.in/service/detail/uttar-pradesh-e-district-services
- Government district reference: Saharanpur district, “Online Certificates e.g. caste etc” — https://saharanpur.nic.in/service/online-certificates/

No search-volume, backlink count, competitor traffic or ranking metric is asserted in this document unless it comes from a connected data source.
