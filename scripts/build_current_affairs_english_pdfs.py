from pathlib import Path
from html import escape
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "current-affairs" / "english" / "source.html"
DAILY = {
    "06": ROOT / "current-affairs" / "english" / "day" / "KAGZI-English-Daily-Current-Affairs-2026-11-06.pdf",
    "05": ROOT / "current-affairs" / "english" / "day" / "KAGZI-English-Daily-Current-Affairs-2026-11-05.pdf",
    "04": ROOT / "current-affairs" / "english" / "day" / "KAGZI-English-Daily-Current-Affairs-2026-11-04.pdf",
}
WEEKLY = ROOT / "current-affairs" / "english" / "weekly" / "KAGZI-English-Weekly-Current-Affairs-2026-11.pdf"
PRINT_CSS = """
@page { size:A4; margin:18mm 16mm 20mm; @bottom-center { content:"KAGZI · English Edition"; font-size:8pt; color:#9aa3b2; } }
body { background:#fff!important; color:#172033; font:10.5pt/1.65 Arial,sans-serif; }
.wrap { width:100%!important; max-width:none!important; }
.cover { box-shadow:none!important; break-after:page; }
.chapter,.news { box-shadow:none!important; break-inside:avoid-page; }
a { color:#244b9b; text-decoration:none; overflow-wrap:anywhere; }
h1,h2,h3 { break-after:avoid; }
"""

def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing English source: {SOURCE}")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(SOURCE.as_uri(), wait_until="networkidle")
        style = page.locator("head style").first.evaluate("(el)=>el.outerHTML")
        # Extract every section before set_content changes the page DOM.
        sections = {}
        for day in ("06", "05", "04"):
            selector = f"#daily-{int(day)}-nov"
            sections[day] = page.locator(selector).evaluate("(el)=>el.outerHTML")
        weekly = page.locator("#weekly").evaluate("(el)=>el.outerHTML")
        daily_roundup = page.evaluate("""() => {
          const days = Array.from(document.querySelectorAll('section[id^="daily-"]'));
          const blocks = days.map(section => {
            const heading = section.querySelector('h2')?.innerText || section.id;
            const articles = Array.from(section.querySelectorAll('article.news')).map(article => article.outerHTML);
            return { heading, articles };
          }).filter(day => day.articles.length);
          const total = blocks.reduce((sum, day) => sum + day.articles.length, 0);
          if (!total) throw new Error('No dated English daily news articles available for weekly compilation');
          return '<section class="chapter" id="weekly-daily-roundup"><div class="label">DATE-WISE NEWS DIGEST</div><h2>Detailed Daily News Digest</h2><p>The dated daily stories currently available are consolidated below for weekly revision. Each story retains its context, exam relevance and official source reference.</p>' +
            blocks.map(day => '<h3>' + day.heading + '</h3>' + day.articles.join('')).join('') +
            '<p class="muted">Detailed news stories included: ' + total + '. Count reflects the available daily source material.</p></section>';
        }""")
        weekly_mcq = page.locator("#daily-6-nov .quiz").evaluate("(el)=>el.outerHTML")
        if not all(sections.values()) or not weekly or not daily_roundup or not weekly_mcq:
            raise RuntimeError("One or more English daily/weekly sections or MCQs are missing")

        outputs = [
            (DAILY["06"], "Daily Current Affairs · 6 November 2026", sections["06"]),
            (DAILY["05"], "Daily Current Affairs · 5 November 2026", sections["05"]),
            (DAILY["04"], "Daily Current Affairs · 4 November 2026", sections["04"]),
            (WEEKLY, "Weekly Current Affairs · 1–6 November 2026", weekly + daily_roundup + weekly_mcq),
        ]
        for output, title, content in outputs:
            cover = f'<section class="cover"><div class="eyebrow">KAGZI · ENGLISH MEDIUM</div><h1>{escape(title)}</h1><p>UPSC · UPPSC · UPSSSC · SSC</p></section>'
            document = f'<!doctype html><html lang="en"><head><meta charset="utf-8">{style}<style>{PRINT_CSS}</style><title>{escape(title)}</title></head><body><main class="wrap">{cover}{content}</main></body></html>'
            output.parent.mkdir(parents=True, exist_ok=True)
            page.set_content(document, wait_until="load")
            page.pdf(path=str(output), format="A4", print_background=True, display_header_footer=False)
        browser.close()

if __name__ == "__main__":
    main()
