from pathlib import Path
from html import escape
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "current-affairs" / "english" / "source.html"
OUT = {
    "daily": ROOT / "current-affairs" / "english" / "day" / "KAGZI-English-Daily-Current-Affairs-2026-11-06.pdf",
    "weekly": ROOT / "current-affairs" / "english" / "weekly" / "KAGZI-English-Weekly-Current-Affairs-2026-11.pdf",
}
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
        browser=p.chromium.launch()
        page=browser.new_page()
        page.goto(SOURCE.as_uri(),wait_until="networkidle")
        style=page.locator("head style").first.evaluate("(el)=>el.outerHTML")
        selections=[
            ("daily","#daily-6-nov, #daily-5-nov, #daily-4-nov","Daily Current Affairs · English Edition"),
            ("weekly","#weekly","Weekly Current Affairs · English Edition"),
        ]
        extracted={}
        for key,selector,title in selections:
            extracted[key]=page.locator(selector).evaluate_all("(els)=>els.map(el=>el.outerHTML)")
            if not extracted[key]:
                raise RuntimeError(f"Missing English {key} section")
        for key,selector,title in selections:
            cover=f'<section class="cover"><div class="eyebrow">KAGZI · ENGLISH MEDIUM</div><h1>{escape(title)}</h1><p>UPSC · UPPSC · UPSSSC · SSC</p></section>'
            document=f'<!doctype html><html lang="en"><head><meta charset="utf-8"><style>{style}{PRINT_CSS}</style><title>{escape(title)}</title></head><body><main class="wrap">{cover}{"".join(extracted[key])}</main></body></html>'
            OUT[key].parent.mkdir(parents=True,exist_ok=True)
            page.set_content(document,wait_until="load")
            page.pdf(path=str(OUT[key]),format="A4",print_background=True,display_header_footer=False)
        browser.close()
if __name__=="__main__":
    main()
