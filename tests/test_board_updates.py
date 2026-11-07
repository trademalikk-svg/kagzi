import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("board_updates_checker", ROOT / "scripts" / "check_board_updates.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BoardUpdateParserTests(unittest.TestCase):
    def test_parses_upmsp_notice_and_normalizes_direct_official_pdf(self):
        html = """<table><tr><td>नोटिस</td><td>वर्ष 2027 की परीक्षा के विवरणों में संशोधन</td>
        <td>02-11-2026</td><td><a href="/docs/notice-2027.pdf">डाउनलोड करें</a></td></tr></table>"""
        items = MODULE.parse_upmsp_html(html, "2026-11-07")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["publishedAt"], "2026-11-02")
        self.assertEqual(items[0]["category"], "notice")
        self.assertEqual(items[0]["documentUrl"], "https://www.upmsp.edu.in/docs/notice-2027.pdf")
        self.assertEqual(items[0]["officialUrl"], items[0]["documentUrl"])

    def test_parses_cbse_exam_circular_and_classifies_practical(self):
        html = """<table><tr><td>05/11/2026</td><td>Conduct of Practical Examination for Classes X and XII</td>
        <td><a href="/files/practical.pdf">ENGLISH</a></td></tr></table>"""
        items = MODULE.parse_cbse_html(html, "2026-11-07")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["publishedAt"], "2026-11-05")
        self.assertEqual(items[0]["category"], "practical")
        self.assertEqual(items[0]["documentUrl"], "https://www.cbse.gov.in/files/practical.pdf")

    def test_rejects_external_document_links_and_uses_official_source_page(self):
        html = """<table><tr><td>06/11/2026</td><td>Result notice</td>
        <td><a href="https://third-party.example/result.pdf">PDF</a></td></tr></table>"""
        items = MODULE.parse_cbse_html(html, "2026-11-07")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["documentUrl"], "")
        self.assertEqual(items[0]["officialUrl"], MODULE.CBSE_CIRCULARS_URL)

    def test_merge_preserves_archive_and_deduplicates_same_board_date_title(self):
        existing = {"items": [{"id": "old", "board": "cbse", "publishedAt": "2026-01-01",
                               "title": "Old notice", "officialUrl": MODULE.CBSE_CIRCULARS_URL}]}
        fresh = [{"id": "new-id", "board": "cbse", "publishedAt": "2026-01-01",
                  "title": "Old notice", "officialUrl": "https://www.cbse.gov.in/files/old.pdf",
                  "documentUrl": "https://www.cbse.gov.in/files/old.pdf"}]
        merged = MODULE.merge_items(existing["items"], fresh)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["id"], "old")
        self.assertEqual(merged[0]["documentUrl"], "https://www.cbse.gov.in/files/old.pdf")

    def test_empty_or_unparseable_source_does_not_create_records(self):
        self.assertEqual(MODULE.parse_upmsp_html("<html><body>maintenance</body></html>", "2026-11-07"), [])
        self.assertEqual(MODULE.parse_cbse_html("<html><body>maintenance</body></html>", "2026-11-07"), [])



    def test_parses_cbse_latest_page_with_its_own_relative_document_base(self):
        html = """<table><tr><td>06/11/2026</td><td>Date Sheet for Class X and Class XII Board Examinations, 2027</td>
        <td><a href="/files/date-sheet-2027.pdf">Download</a></td></tr></table>"""
        items = MODULE.parse_cbse_html(html, "2026-11-07", MODULE.CBSE_HOME_URL)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["category"], "date-sheet")
        self.assertEqual(items[0]["sourceUrl"], MODULE.CBSE_HOME_URL)
        self.assertEqual(items[0]["documentUrl"], "https://www.cbse.gov.in/files/date-sheet-2027.pdf")

if __name__ == "__main__":
    unittest.main()
