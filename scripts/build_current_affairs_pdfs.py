from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from html import escape
import json
import shutil

from playwright.sync_api import sync_playwright
from current_affairs_pdf_content import build_pib_digest_fragment

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "current-affairs-book-source.html"
DATA = ROOT / "current-affairs/data/items.json"
DAY_DIR = ROOT / "current-affairs/day/"
WEEK_DIR = ROOT / "current-affairs/weekly/"

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


def load_pib_items():
    if not DATA.exists():
        return []
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    return payload.get("items", []) if isinstance(payload, dict) else []


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing source: {SOURCE}")
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date().isoformat()
    pib_items = load_pib_items()
    daily_digest = build_pib_digest_fragment(pib_items, "daily", today)
    weekly_digest = build_pib_digest_fragment(pib_items, "weekly", today)

    daily_dated = DAY_DIR / f"KAGZI-Daily-Current-Affairs-{today}.pdf"
    daily_latest = DAY_DIR / "KAGZI-Daily-Current-Affairs-Latest.pdf"
    iso = datetime.now(ZoneInfo("Asia/Kolkata")).date().isocalendar()
    week_id = f"{iso.year}-W{iso.week:02d}"
    weekly_dated = WEEK_DIR / f"KAGZI-Weekly-Current-Affairs-{week_id}.pdf"
    weekly_latest = WEEK_DIR / "KAGZI-Weekly-Current-Affairs-Latest.pdf"

    DAY_DIR.mkdir(parents=True, exist_ok=True)
    WEEK_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(SOURCE.as_uri(), wait_until="networkidle")
        style = page.locator("head style").first.evaluate("(el) => el.outerHTML")

        # Daily: curated authored sections plus today's official PIB RSS digest when available.
        daily = page.evaluate("""() => ['daily-6-nov','quiz-6-nov','daily-5-nov','daily','method','quiz']
          .map(id => document.getElementById(id)?.outerHTML || '').filter(Boolean)""")
        if not daily:
            raise RuntimeError("Daily sections were not found")
        if daily_digest:
            daily.append(daily_digest)
        page.set_content(make_document("दैनिक समसामयिक घटनाक्रम", daily, style), wait_until="load")
        page.pdf(path=str(daily_dated), format="A4", print_background=True, display_header_footer=False)
        shutil.copyfile(daily_dated, daily_latest)

        # Weekly: curated weekly section, date-wise authored stories, MCQs, and official PIB RSS digest.
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
        weekly_mcq = page.evaluate("""() => {
          const sources = Array.from(document.querySelectorAll('[id^="quiz-"]'));
          const blocks = sources.map(source => {
            const questions = Array.from(source.querySelectorAll('details'));
            if (!questions.length) return '';
            const heading = source.querySelector('b')?.innerText || source.id;
            const items = questions.map(item => {
              const question = item.querySelector('summary')?.innerText || '';
              const answer = item.querySelector('p')?.innerHTML || '';
              return '<li><p><b>' + question + '</b></p>' + answer + '</li>';
            }).join('');
            return '<h3>' + heading + '</h3><ol>' + items + '</ol>';
          }).filter(Boolean);
          if (!blocks.length) throw new Error('No Hindi daily practice questions available for weekly compilation');
          return '<section class="chapter" id="weekly-mcq"><div class="label">WEEKLY PRACTICE · QUESTIONS</div><h2>साप्ताहिक अभ्यास प्रश्न</h2><p>ये प्रश्न उपलब्ध दैनिक अंकों के आधिकारिक-स्रोत आधारित तथ्यों से संकलित हैं। उत्तर प्रत्येक प्रश्न के नीचे दिए गए हैं।</p>' + blocks.join('') + '</section>';
        }""")
        weekly_fragments = [weekly, daily_roundup, weekly_mcq]
        if weekly_digest:
            weekly_fragments.append(weekly_digest)
        page.set_content(make_document("साप्ताहिक समसामयिक सार", weekly_fragments, style), wait_until="load")
        page.pdf(path=str(weekly_dated), format="A4", print_background=True, display_header_footer=False)
        shutil.copyfile(weekly_dated, weekly_latest)
        browser.close()


if __name__ == "__main__":
    main()
