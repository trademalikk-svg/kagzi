# KAGZI Study Material Books Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert KAGZI's Study Material Library into nine substantial, mobile-friendly Hindi competitive-exam study books that share the editorial structure and visual language of the existing Current Affairs book.

**Architecture:** Keep the existing static Cloudflare Pages architecture. Use one standalone HTML page per subject book, linked from `study-material.html`; reuse the visual patterns from `current-affairs-book.html` and `competitive-polity-complete.html` without introducing a framework, backend, or paid dependency. Preserve the existing Current Affairs book and Polity book as working reference/learning resources.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript for small interactive MCQ answer reveals, GitHub Contents API, Cloudflare Pages, existing Node-based audit scripts.

## Global Constraints

- Hindi-first, beginner-friendly original content; support UPPSC/UPPCS and UPSSSC first, with usefulness for UPSC, SSC and Railway.
- Each book must visibly distinguish completed chapters from planned/ongoing coverage; never label a partial syllabus as complete.
- Each substantive chapter includes learning objectives, explanations, examples where useful, exam facts, revision notes, practice MCQs with explanations, and primary/official references for changeable facts.
- Use original explanations and lawful public-domain/official material only; do not copy copyrighted coaching books or unauthorized PDFs.
- Mobile-first layout, readable Devanagari typography, accessible navigation, print/Save as PDF support, no external paid libraries.
- Preserve current-affairs-book.html and competitive-polity-complete.html; do not replace them.
- Fetch the latest file SHA before every GitHub update; never make concurrent writes to the same path.
- Verify each deployment against its exact commit before calling it live.

---

### Task 1: Convert the Study Material page into a nine-book catalogue

**Files:**
- Modify: `study-material.html`
- Test: `tests/study-books-library-audit.mjs` (create)

**Interfaces:**
- Consumes: existing static page links and the nine subject definitions.
- Produces: stable book URLs: `history-book.html`, `geography-book.html`, `up-gk-book.html`, `economy-book.html`, `science-book.html`, `environment-book.html`, `math-reasoning-book.html`, `hindi-book.html`, and `mcq-pyq-book.html`.

- [ ] **Step 1: Add the focused failing audit**
  Assert that the library page links to all nine exact book paths, retains the Current Affairs book link and the existing Polity book link, and includes mobile responsive styling.
- [ ] **Step 2: Verify the relevant failure**
  Run: `node tests/study-books-library-audit.mjs`
  Expected: failure because most of the nine book links do not yet exist in the catalogue.
- [ ] **Step 3: Implement the catalogue**
  Replace placeholder-only subject cards with book cards that show book number, title, syllabus coverage status, target exams, chapter count/status, and an accessible “पुस्तक खोलें” link. Keep Current Affairs and Polity as separate existing books/resources. Include a clear note that chapter coverage grows in verified releases.
- [ ] **Step 4: Verify the focused pass**
  Run: `node tests/study-books-library-audit.mjs`
  Expected: all nine subject links and both existing reference links are present; mobile breakpoint exists.
- [ ] **Step 5: Run the affected integration check**
  Run: `node tests/education-library-audit.mjs`
  Expected: existing Education library navigation and resource checks remain passing.
- [ ] **Step 6: Commit the passing deliverable**
  Commit only `study-material.html` and `tests/study-books-library-audit.mjs` with message `feat: organize study material into nine subject books`.

### Task 2: Build the first two complete book shells and substantive chapters

**Files:**
- Create: `history-book.html`
- Create: `geography-book.html`
- Create: `tests/study-books-content-audit.mjs`

**Interfaces:**
- Consumes: the shared editorial contract in this plan and visual patterns from `current-affairs-book.html` and `competitive-polity-complete.html`.
- Produces: consistent book structure with IDs for cover, contents, chapters, revision, practice and references.

- [ ] **Step 1: Add failing content audit**
  Assert both pages include Hindi document language, title/description, cover, table of contents, dated edition status, at least one substantive chapter, learning objectives, revision summary, MCQs with explanations, references, print CSS and mobile CSS.
- [ ] **Step 2: Verify the relevant failure**
  Run: `node tests/study-books-content-audit.mjs`
  Expected: failure because the new book files do not exist.
- [ ] **Step 3: Implement history and geography books**
  History: introduce chronological coverage (ancient, medieval, modern, national movement) and expand the existing Harappan chapter into a well-structured chapter with source notes; add the next chronological chapter only when supported by reliable references.
  Geography: build foundations (Earth, latitude/longitude, physical divisions of India, drainage) with diagrams made using accessible HTML/CSS or inline SVG only when they materially clarify concepts. Use official survey/department sources for current geographic facts.
  Each book must show “प्रारंभिक संस्करण / अध्यायवार विस्तार जारी” until its syllabus coverage is actually complete.
- [ ] **Step 4: Verify focused pass**
  Run: `node tests/study-books-content-audit.mjs`
  Expected: both books pass structural/content assertions.
- [ ] **Step 5: Run affected integration checks**
  Run: `node tests/study-books-library-audit.mjs && node tests/education-library-audit.mjs`
  Expected: links and existing education reader flows remain valid.
- [ ] **Step 6: Commit the passing deliverable**
  Commit the two book pages and audit with message `feat: add history and geography study books`.

### Task 3: Build the remaining six subject books

**Files:**
- Create: `up-gk-book.html`
- Create: `economy-book.html`
- Create: `science-book.html`
- Create: `environment-book.html`
- Create: `math-reasoning-book.html`
- Create: `hindi-book.html`
- Create: `tests/study-books-content-audit.mjs` (extend)

**Interfaces:**
- Consumes: the book structure and audit contract established in Task 2.
- Produces: six consistent standalone book pages, each linked from the catalogue.

- [ ] **Step 1: Extend failing content audit**
  Add assertions for each exact filename, subject heading, chapter list, one substantive starter chapter, revision section, explained practice questions, sources/date where facts are time-sensitive, print and responsive styles.
- [ ] **Step 2: Verify the relevant failure**
  Run: `node tests/study-books-content-audit.mjs`
  Expected: failure identifying the six missing pages.
- [ ] **Step 3: Implement six books**
  UP GK: state formation/history, geography/rivers, administration, economy/agriculture, culture and official schemes; date all administrative and scheme facts.
  Economy: national income, inflation, banking, RBI/monetary policy, budget/taxation, employment and development.
  Science: physics, chemistry, biology, health/science literacy and technology.
  Environment: ecosystem, biodiversity, conservation, pollution, climate and Indian legal/institutional framework.
  Math & Reasoning: concept, formula, worked example, graded practice and answer explanation.
  Hindi: grammar, vocabulary, sentence correction, comprehension and usage examples.
  Each starts with a meaningful introductory chapter and a truthful syllabus-progress marker; avoid filler chapters and unsupported “complete” claims.
- [ ] **Step 4: Verify focused pass**
  Run: `node tests/study-books-content-audit.mjs`
  Expected: all eight subject pages (including Task 2 pages) pass.
- [ ] **Step 5: Run affected integration checks**
  Run: `node tests/study-books-library-audit.mjs && node tests/education-library-audit.mjs`
  Expected: every catalogue link resolves by exact filename and existing Learning Hub remains intact.
- [ ] **Step 6: Commit the passing deliverable**
  Commit six pages and the extended audit with message `feat: add six competitive exam subject books`.

### Task 4: Add dedicated MCQ/PYQ practice book and verify production

**Files:**
- Create: `mcq-pyq-book.html`
- Modify: `study-material.html` (only if final catalogue metadata needs correction)
- Create: `tests/study-books-deployment-check.md`

**Interfaces:**
- Consumes: subject names and chapter structures from all eight subject books.
- Produces: an independent practice book organized by subject/topic, with explained original MCQs and clearly attributed official previous-paper links where verified.

- [ ] **Step 1: Add failing practice-book assertions**
  Assert topic filters or clear topic sections, answer explanations, accessible reveal controls, distinction between original practice questions and verified PYQs, and source attribution for any PYQ.
- [ ] **Step 2: Verify the relevant failure**
  Run: `node tests/study-books-content-audit.mjs`
  Expected: failure because the dedicated practice book is missing.
- [ ] **Step 3: Implement practice book**
  Add original exam-style questions with worked explanations across all eight subjects. Only label a question “PYQ” when the exact exam/year and official question paper source are verified; otherwise label it “अभ्यास प्रश्न”. Make answer reveal keyboard-accessible and usable without JavaScript by keeping answers visible in a fallback/details element.
- [ ] **Step 4: Verify focused pass**
  Run: `node tests/study-books-content-audit.mjs`
  Expected: all nine book pages satisfy the structural contract.
- [ ] **Step 5: Run full integration and deployment checks**
  Run: `node tests/study-books-library-audit.mjs && node tests/education-library-audit.mjs && node tests/education-reader-audit.mjs`
  Expected: all tests pass; all nine links resolve; existing Current Affairs, Polity and reader flows remain available. After commit, verify Cloudflare Pages reports success for that exact commit and open each book URL plus the catalogue on the production domain.
- [ ] **Step 6: Commit the passing deliverable**
  Commit practice book and deployment checklist with message `feat: add explained mcq and pyq practice book`.

---

## Unresolved externally observable decisions

- Exact target-exam weighting beyond the stated priority (UPPSC/UPPCS and UPSSSC first; UPSC, SSC and Railway as secondary) is not specified. The initial release will keep a balanced shared-GS scope and label exam relevance per chapter.
- The user has not supplied a set of official previous-year question PDFs. Until exact official sources are found and attributed, questions will be labeled original practice questions rather than PYQs.
- Full syllabus completion is a progressive editorial milestone, not a single deployment condition; each book must state its actual coverage status.
