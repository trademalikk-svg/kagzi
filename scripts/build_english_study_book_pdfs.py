#!/usr/bin/env python3
"""Build the nine translated KAGZI English study-book PDFs."""
from __future__ import annotations

import json
from html import escape
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "study-material" / "english" / "books.json"
OUTPUT = ROOT / "study-material" / "english" / "pdf"

CSS = """
@page { size: A4; margin: 18mm 16mm 20mm; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: #172033;
  font: 10.5pt/1.62 "Noto Sans", "Noto Sans Devanagari", Arial, sans-serif; }
body { position: relative; }
.cover { min-height: 235mm; display: flex; flex-direction: column; justify-content: center;
  padding: 22mm 14mm; page-break-after: always; border: 2px solid #24365f; }
.brand { font-size: 11pt; font-weight: 900; letter-spacing: 2px; color: #4557a5; }
.book-no { margin-top: 22mm; color: #66718a; font-weight: 800; letter-spacing: 1.2px; }
h1 { font-size: 31pt; line-height: 1.16; margin: 8mm 0 4mm; color: #152348; }
.subtitle { font-size: 16pt; color: #4f5f85; }
.edition { margin-top: 15mm; padding: 9px 12px; background: #eef2ff; border-left: 4px solid #4557a5; }
.cover-note { margin-top: auto; padding-top: 18mm; font-size: 9pt; color: #66718a; }
main { width: 100%; }
.intro { padding: 12px 15px; background: #f2f5ff; border-left: 4px solid #4557a5;
  margin: 0 0 18px; }
h2 { color: #1e315f; font-size: 19pt; margin: 18px 0 9px; break-after: avoid; }
h3 { color: #354a83; font-size: 13pt; margin: 15px 0 5px; break-after: avoid; }
.objective { color: #5c6880; font-style: italic; margin: 4px 0 14px; }
.section { margin: 10px 0 13px; break-inside: avoid; }
.section p { margin: 4px 0; }
.quick { margin: 16px 0; padding: 12px 15px; background: #f3f7f4;
  border-left: 4px solid #2c7a57; break-inside: avoid; }
.quick ul { margin: 7px 0 0; padding-left: 19px; }
.qa { margin: 11px 0; padding: 10px 13px; border: 1px solid #e1e6ef; border-radius: 8px; break-inside: avoid; }
.question { font-weight: 800; color: #24365f; }
.answer { margin-top: 5px; }
.sources { margin-top: 18px; padding-top: 12px; border-top: 1px solid #dfe4ed; font-size: 9pt; color: #58647b; }
footer { margin-top: 22px; font-size: 8.5pt; color: #7a8498; border-top: 1px solid #e4e8ef; padding-top: 8px; }
@media print { a { color: inherit; text-decoration: none; } }
"""

def render_book(book: dict, edition: str, coverage_note: str) -> str:
    title = escape(book["title"])
    subtitle = escape(book["subtitle"])
    intro = escape(book["intro"])
    sections = []
    for chapter in book["chapters"]:
        sections.append(f'<h2>{escape(chapter["title"])}</h2>')
        sections.append(f'<p class="objective"><b>Learning objective:</b> {escape(chapter["objective"])}</p>')
        for heading, body in chapter["sections"]:
            sections.append(f'<section class="section"><h3>{escape(heading)}</h3><p>{escape(body)}</p></section>')
        sections.append('<section class="quick"><b>Quick Revision</b><ul>')
        sections.extend(f'<li>{escape(item)}</li>' for item in chapter.get("quick", []))
        sections.append('</ul></section>')
        if chapter.get("questions"):
            sections.append('<h3>Practice and Self-Assessment</h3>')
            for question, answer in chapter["questions"]:
                sections.append(f'<div class="qa"><div class="question">{escape(question)}</div><div class="answer"><b>Answer and explanation:</b> {escape(answer)}</div></div>')
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><style>{CSS}</style>
<title>{title} | KAGZI English Study Book</title></head><body>
<section class="cover"><div class="brand">KAGZI · ORIGINAL STUDY SERIES</div>
<div class="book-no">STUDY BOOK {escape(book["number"])} · ENGLISH EDITION</div>
<h1>{title}</h1><div class="subtitle">{subtitle}</div>
<div class="edition">{escape(edition)}<br><b>Initial edition · Chapter-wise expansion in progress</b></div>
<div class="cover-note">For UPPSC / UPSSSC, UPSC, SSC and Railway examination preparation.<br>{escape(coverage_note)}</div></section>
<main><div class="intro"><b>About this book</b><br>{intro}</div>
{''.join(sections)}
<div class="sources"><b>Sources and further study</b><br>
This is an original KAGZI explanation translated and adapted from the corresponding Hindi study edition. For verification, consult official NCERT textbooks, relevant Government of India and state-government departments, and examination commission notifications. Administrative and current-affairs facts may change and should be checked against current official sources. No unauthorised coaching book or copyrighted PDF has been reproduced. Official PYQ labels are used only when the exact examination year and official question-paper source have been verified.</div>
<footer>© KAGZI Learning Hub · Original Study Series · English Edition</footer></main>
</body></html>"""

def main() -> None:
    if not SOURCE.is_file():
        raise RuntimeError(f"Missing English source data: {SOURCE}")
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    books = data.get("books", [])
    if len(books) != 9:
        raise RuntimeError(f"Expected 9 English study books, found {len(books)}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        for book in books:
            if not book.get("chapters") or not book.get("title"):
                raise RuntimeError(f"Incomplete English book data: {book.get('id')}")
            html = render_book(book, data["edition"], data["coverage_note"])
            page.set_content(html, wait_until="load")
            target = OUTPUT / book["filename"]
            page.pdf(path=str(target), format="A4", print_background=True,
                     display_header_footer=True,
                     header_template='<div style="width:100%;margin:0 16mm;font-size:8px;color:#8a93a5">KAGZI · ENGLISH STUDY MATERIAL</div>',
                     footer_template='<div style="width:100%;margin:0 16mm;font-size:8px;color:#8a93a5;display:flex;justify-content:space-between"><span>KAGZI Learning Hub</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
                     margin={"top":"22mm","bottom":"23mm","left":"16mm","right":"16mm"})
            raw = target.read_bytes()
            if len(raw) < 5000 or not raw.startswith(b"%PDF-") or b"%%EOF" not in raw[-2048:]:
                raise RuntimeError(f"PDF validation failed: {target}")
            print(f"Built {target.relative_to(ROOT)} ({len(raw)} bytes)")
        browser.close()

if __name__ == "__main__":
    main()
