from pathlib import Path
from playwright.sync_api import sync_playwright
from html import escape

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "current-affairs-book-source.html"
OUT = {
    "daily": ROOT / "current-affairs/day/KAGZI-Daily-Current-Affairs-2026-11-06.pdf",
    "weekly": ROOT / "current-affairs/weekly/KAGZI-Weekly-Current-Affairs-2026-11.pdf",
}

PRINT_CSS = """
@page { size: A4; margin: 18mm 16mm 20mm; @bottom-center { content: "https://kagzi-8cy.pages.dev"; font-size: 8pt; color: #9aa3b2; } }
body { background:#fff!important; color:#172033; font: 10.5pt/1.65 "Noto Sans Devanagari", sans-serif; }
.wrap { width:100%!important; max-width:none!important; }
.cover { box-shadow:none!important; break-after:page; }
.chapter, .news, .month-block { box-shadow:none!important; break-inside:avoid-page; }
.chapter { margin:0 0 12px!important; padding:16px!important; }
.news { break-inside:avoid-page; }
a { color:#244b9b; text-decoration:none; overflow-wrap:anywhere; }
body:before { content:"KAGZI"; position:fixed; top:42%; left:24%; font-size:72pt; font-weight:900; color:rgba(60,75,110,.035); transform:rotate(-28deg); z-index:-1; }
h1,h2,h3 { break-after:avoid; }
"""

def make_document(title, fragments, style):
    return f'''<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{style}<style>{PRINT_CSS}</style><title>{escape(title)}</title></head><body><main class="wrap"><section class="cover"><div class="eyebrow">KAGZI · ORIGINAL STUDY BOOK</div><h1>{escape(title)}</h1><p>हिंदी माध्यम · UPPSC · UPSSSC · SSC · UPSC</p></section>{''.join(fragments)}<footer style="margin-top:24px;color:#68748a;font-size:9pt">KAGZI की मौलिक अध्ययन सामग्री। आधिकारिक स्रोतों को अंतिम संदर्भ मानें।</footer></main></body></html>'''

def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing source: {SOURCE}")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(SOURCE.as_uri(), wait_until="networkidle")
        style = page.locator("head style").first.evaluate("(el) => el.outerHTML")
        # Daily: newest dated update, older daily entry, daily revision and practice.
        daily = page.evaluate("""() => ['daily-6-nov','quiz-6-nov','daily-5-nov','daily','method','quiz']
          .map(id => document.getElementById(id)?.outerHTML || '').filter(Boolean)""")
        if not daily:
            raise RuntimeError("Daily sections were not found")
        OUT["daily"].parent.mkdir(parents=True, exist_ok=True)
        page.set_content(make_document("दैनिक समसामयिक घटनाक्रम", daily, style), wait_until="load")
        page.pdf(path=str(OUT["daily"]), format="A4", print_background=True, display_header_footer=False)

        # Weekly section + all dated daily news articles currently available.
        page.goto(SOURCE.as_uri(), wait_until="networkidle")
        weekly = page.locator("#weekly").evaluate("(el) => el.outerHTML")
        daily_roundup = page.evaluate("""() => {
          const days = Array.from(document.querySelectorAll('section[id^="daily-"]'));
          const blocks = days.map(section => {
            const heading = section.querySelector('h2')?.innerText || section.id;
            const articles = Array.from(section.querySelectorAll('article.news')).map(article => article.outerHTML);
            return { heading, articles };
          }).filter(day => day.articles.length);
          const total = blocks.reduce((sum, day) => sum + day.articles.length, 0);
          if (!total) throw new Error('No dated daily news articles available for weekly compilation');
          return '<section class="chapter" id="weekly-daily-roundup"><div class="label">DATE-WISE NEWS DIGEST</div><h2>दिनवार विस्तृत समाचार</h2><p>नीचे उपलब्ध दैनिक अंकों की खबरों को सप्ताहवार पुनरावृत्ति के लिए एक साथ रखा गया है। प्रत्येक खबर के साथ उसका मूल संदर्भ और परीक्षा उपयोगिता सुरक्षित रखी गई है।</p>' +
            blocks.map(day => '<h3>' + day.heading + '</h3>' + day.articles.join('')).join('') +
            '<p class="muted">इस PDF में शामिल विस्तृत समाचार: ' + total + '। यह संख्या उपलब्ध दैनिक स्रोत सामग्री पर आधारित है।</p></section>';
        }""")
        OUT["weekly"].parent.mkdir(parents=True, exist_ok=True)
        page.set_content(make_document("साप्ताहिक समसामयिक सार", [weekly, daily_roundup], style), wait_until="load")
        page.pdf(path=str(OUT["weekly"]), format="A4", print_background=True, display_header_footer=False)

        browser.close()

def await_count(locator):
    return locator.count()

def await_click(locator):
    locator.click()

if __name__ == "__main__":
    main()
