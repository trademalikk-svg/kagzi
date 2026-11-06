import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOOTER_PAGES = [
    "index.html",
    "privacy.html",
    "about.html",
    "contact.html",
    "terms.html",
    "pricing.html",
    "gov-documents.html",
]

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = []
        self.text = []
        self.links = []
        self.in_title = False
        self.footer_depth = 0
        self.footer_links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "footer":
            self.footer_depth += 1
        if tag == "a" and attrs.get("href"):
            href = attrs["href"]
            self.links.append(href)
            if self.footer_depth:
                self.footer_links.append(href)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "footer" and self.footer_depth:
            self.footer_depth -= 1

    def handle_data(self, data):
        self.text.append(data)
        if self.in_title:
            self.title.append(data)

    @property
    def content(self):
        return " ".join(self.text).lower()

def parse_page(filename):
    parser = PageParser()
    parser.feed((ROOT / filename).read_text(encoding="utf-8"))
    return parser

class KagziLegalPagesTests(unittest.TestCase):
    def test_affiliate_disclosure_page(self):
        page = parse_page("affiliate-disclosure.html")
        body = page.content
        self.assertIn("affiliate disclosure", " ".join(page.title).lower() + " " + body)
        self.assertIn("commission", body)
        self.assertIn("no extra", body)
        self.assertIn("not every external link", body)
        self.assertIn("no active affiliate network", body)
        self.assertIn("hello@kagzi.in", body)
        self.assertIn("https://kagzi-8cy.pages.dev/affiliate-disclosure.html",
                      (ROOT / "affiliate-disclosure.html").read_text(encoding="utf-8"))
        for target in ("index.html", "privacy.html", "terms.html"):
            self.assertIn(target, page.links)

    def test_privacy_policy_topics_and_existing_disclosures(self):
        page = parse_page("privacy.html")
        body = page.content
        for topic in ("cookies", "analytics", "advertising", "affiliate links"):
            self.assertIn(topic, body)
        for preserved in ("process selected files locally in your browser", "ai provider",
                          "hello@kagzi.in", "third-party"):
            self.assertIn(preserved, body)
        self.assertIn("no active affiliate network", body)
        self.assertIn("no active advertising network", body)
        self.assertIn("no active analytics provider", body)

    def test_all_relevant_footers_link_disclosure_once(self):
        for filename in FOOTER_PAGES:
            with self.subTest(page=filename):
                page = parse_page(filename)
                matches = [href for href in page.footer_links
                           if href in ("affiliate-disclosure.html", "./affiliate-disclosure.html")]
                self.assertEqual(len(matches), 1, f"{filename} must have exactly one footer disclosure link")

if __name__ == "__main__":
    unittest.main()
