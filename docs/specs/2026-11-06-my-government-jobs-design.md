# My Government Jobs — India-wide Directory Design

## Goal
Create a mobile-first, Hindi/English government-jobs directory on KAGZI, covering all 28 Indian states, 8 Union Territories, and Central Government recruitment. KAGZI is an information directory, not a government authority or recruitment agency.

## Information architecture
- A My Government Jobs landing page with a searchable state/UT directory and a Central Government section.
- One dedicated page per state and Union Territory.
- Each state/UT page provides its own search and filters for department, post/title, qualification, recruitment status, and keyword.
- Job detail cards link to the official recruitment notification and official application destination. Do not host application forms or collect application credentials.

## Recruitment record fields
- State/UT or Central Government
- Recruiting department/agency
- Post or recruitment title
- Qualification summary (only when supported by the official notice)
- Important dates and current status (only when supported by the official notice)
- Official notification URL
- Official application URL
- Source URL and last-checked date
- Verification status: verified / needs recheck / expired

Unknown or unverified details must be labelled clearly, never inferred. Expired notices should be labelled expired or removed from active results. No fabricated vacancies, dates, salary, eligibility, or links.

## Sharing requirements
- Each job card has a Share button. On supported devices use the native share sheet; otherwise copy a prepared message.
- Shared message includes the job title, official notification/application link, the relevant KAGZI job-directory page link, and the KAGZI homepage URL (https://kagzi-8cy.pages.dev/).
- The landing page and each state/UT page also have a Share KAGZI button that shares that page URL plus the KAGZI homepage URL.
- WhatsApp share is a separate explicit action and includes both the specific page/job link and KAGZI homepage URL.
- Do not silently send messages. The visitor chooses the destination and confirms sharing.

## Search and accessibility
- Search supports Hindi and English title/department keywords where available.
- Filters must work together and have a clear/reset action.
- Controls have accessible labels and keyboard focus states; layout is responsive for Android-sized screens.

## Data and safety
- Use official government recruitment sources as the authority. Third-party job sites may not be treated as official application destinations.
- Do not request Aadhaar, OTP, passwords, bank details, or application account credentials.
- Display a visible disclaimer: KAGZI is independent and users must verify current details on the official notice before applying.
- Keep source metadata so notices can be rechecked and corrected.

## Delivery and verification
- Work only on a feature branch associated with PR #41; do not merge or publish to production.
- Test state/UT routing, search/filter combinations, share fallbacks, WhatsApp message contents, and responsive layout.
- Manually inspect representative Central, state, and UT pages. Do not claim all recruitment data is verified unless each record has been checked against its official source.
