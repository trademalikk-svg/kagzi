from pathlib import Path
from html import escape
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "study-material" / "pdf"
BOOKS = [
    ("history-book.html", "KAGZI-History.pdf", "भारतीय इतिहास"),
    ("geography-book.html", "KAGZI-Geography.pdf", "भारत एवं विश्व भूगोल"),
    ("up-gk-book.html", "KAGZI-UP-GK.pdf", "उत्तर प्रदेश सामान्य ज्ञान"),
    ("economy-book.html", "KAGZI-Economy.pdf", "भारतीय अर्थव्यवस्था"),
    ("science-book.html", "KAGZI-Science.pdf", "सामान्य विज्ञान एवं तकनीक"),
    ("environment-book.html", "KAGZI-Environment.pdf", "पर्यावरण एवं पारिस्थितिकी"),
    ("math-reasoning-book.html", "KAGZI-Maths-Reasoning.pdf", "गणित एवं रीजनिंग"),
    ("hindi-book.html", "KAGZI-Hindi.pdf", "सामान्य हिंदी"),
    ("mcq-pyq-book.html", "KAGZI-MCQ-PYQ.pdf", "MCQ एवं PYQ अभ्यास"),
]

PRINT_CSS = """
@page { size: A4; margin: 17mm 15mm 19mm;
  @bottom-center { content: "KAGZI · अध्ययन सामग्री"; font-size: 8pt; color: #8992a3; } }
html, body { background: #fff !important; color: #172033 !important;
  font-family: "Noto Sans Devanagari", "Noto Sans", sans-serif !important;
  font-size: 10pt !important; line-height: 1.65 !important; }
body { margin: 0 !important; }
.wrap { width: 100% !important; max-width: none !important; margin: 0 !important; }
header, nav, button, .print-only-hide { display: none !important; }
.cover { box-shadow: none !important; break-after: avoid-page; }
.panel, section { box-shadow: none !important; }
h1, h2, h3 { break-after: avoid; }
p, li { orphans: 3; widows: 3; }
details { break-inside: avoid; }
a { color: #244b9b !important; text-decoration: none !important; overflow-wrap: anywhere; }
img { max-width: 100% !important; }
"""

def build_html(title, styles, content):
    return f"""<!doctype html>
<html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} | KAGZI</title>{styles}<style>{PRINT_CSS}</style></head>
<body><main class="wrap">{content}</main></body></html>"""

def main():
    missing = [source for source, _, _ in BOOKS if not (ROOT / source).is_file()]
    if missing:
        raise RuntimeError("Missing study-book source pages: " + ", ".join(missing))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        for source, filename, title in BOOKS:
            source_path = ROOT / source
            page.goto(source_path.as_uri(), wait_until="networkidle")
            styles = page.locator("head style").evaluate_all(
                "(nodes) => nodes.map(node => node.outerHTML).join('\\n')"
            )
            content = page.locator("main").first.evaluate(
                """(main) => {
                  const clone = main.cloneNode(true);
                  clone.querySelectorAll('button, script, header, nav').forEach(node => node.remove());
                  return clone.innerHTML;
                }"""
            )
            chapter_count = page.locator("main h2").count()
            if len(content.strip()) < 1500 or chapter_count < 2 or "अध्याय" not in content:
                raise RuntimeError(
                    f"Incomplete study book source: {source} "
                    f"(content={len(content)}, h2={chapter_count})"
                )
            html = build_html(title, styles, content)
            page.set_content(html, wait_until="load")
            output = OUTPUT_DIR / filename
            page.pdf(
                path=str(output),
                format="A4",
                print_background=True,
                display_header_footer=False,
                prefer_css_page_size=True,
            )
            if not output.is_file() or output.stat().st_size < 5000:
                raise RuntimeError(f"PDF output is missing or unexpectedly small: {output}")
            print(f"Built {output.relative_to(ROOT)} ({output.stat().st_size} bytes)")
        browser.close()

if __name__ == "__main__":
    main()
