import importlib.util
import unittest
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("current_affairs_updater", ROOT / "scripts" / "update_current_affairs.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentAffairsParserTests(unittest.TestCase):
    def test_parses_hindi_pib_rss_and_keeps_official_source(self):
        xml = """<?xml version="1.0"?>
        <rss><channel>
          <item>
            <title>उत्तर प्रदेश सरकार की नई योजना</title>
            <link>https://www.pib.gov.in/PressReleasePage.aspx?PRID=12345</link>
            <description><![CDATA[<p>परीक्षा के लिए महत्वपूर्ण सूचना।</p>]]></description>
            <pubDate>Fri, 06 Nov 2026 10:00:00 GMT</pubDate>
          </item>
          <item>
            <title>एक अन्य आधिकारिक विज्ञप्ति</title>
            <link>https://www.pib.gov.in/PressReleasePage.aspx?PRID=12346</link>
            <description>दूसरी आधिकारिक सूचना।</description>
            <pubDate>Fri, 06 Nov 2026 12:00:00 GMT</pubDate>
          </item>
          <item>
            <title>अनधिकृत लिंक</title>
            <link>https://example.com/news</link>
            <description>इसे नहीं लेना चाहिए</description>
            <pubDate>Fri, 06 Nov 2026 11:00:00 GMT</pubDate>
          </item>
        </channel></rss>""".encode("utf-8")
        items = MODULE.parse_feed(xml)
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0]["date"], "2026-11-06")
        self.assertEqual(items[0]["source"], "पत्र सूचना कार्यालय (PIB)")
        self.assertIn("परीक्षा के लिए", items[0]["description"])
        self.assertTrue(items[0]["url"].startswith("https://www.pib.gov.in/"))

    def test_rejects_items_without_a_valid_publication_date(self):
        xml = """<rss><channel><item>
        <title>तारीख के बिना</title>
        <link>https://www.pib.gov.in/PressReleasePage.aspx?PRID=1</link>
        <description>विवरण</description>
        </item></channel></rss>""".encode("utf-8")
        self.assertEqual(MODULE.parse_feed(xml), [])

    def test_category_classifier_is_explicitly_rule_based(self):
        self.assertEqual(MODULE.category_for("नई अंतरिक्ष तकनीक", ""), "विज्ञान एवं तकनीक")

    def test_parse_feed_deduplicates_duplicate_official_urls(self):
        xml = b"""<rss><channel>
        <item><title>Same notice</title><link>https://www.pib.gov.in/PressReleasePage.aspx?PRID=77</link><description>First</description><pubDate>Fri, 06 Nov 2026 10:00:00 GMT</pubDate></item>
        <item><title>Same notice updated</title><link>https://www.pib.gov.in/PressReleasePage.aspx?PRID=77</link><description>Second</description><pubDate>Fri, 06 Nov 2026 11:00:00 GMT</pubDate></item>
        </channel></rss>"""
        items = MODULE.parse_feed(xml)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["id"], "https://www.pib.gov.in/PressReleasePage.aspx?PRID=77")

    def test_rejects_non_https_and_lookalike_pib_hosts(self):
        xml = b"""<rss><channel>
        <item><title>HTTP link</title><link>http://www.pib.gov.in/PressReleasePage.aspx?PRID=1</link><description>x</description><pubDate>Fri, 06 Nov 2026 10:00:00 GMT</pubDate></item>
        <item><title>Lookalike</title><link>https://pib.gov.in.example.com/news</link><description>x</description><pubDate>Fri, 06 Nov 2026 10:00:00 GMT</pubDate></item>
        </channel></rss>"""
        self.assertEqual(MODULE.parse_feed(xml), [])

    def test_update_archive_preserves_last_good_file_when_feed_is_empty(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "items.json"
            original = {"updated_at": "2026-11-06T08:00+05:30", "items": [{"id": "old"}]}
            path.write_text(json.dumps(original), encoding="utf-8")
            with self.assertRaises(RuntimeError):
                MODULE.update_archive([], path, "2026-11-07T08:00+05:30")
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), original)

    def test_update_archive_merges_history_and_writes_atomically(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "items.json"
            old = {"id": "old", "date": "2026-11-05", "title": "Old", "url": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1"}
            path.write_text(json.dumps({"items": [old]}), encoding="utf-8")
            fresh = {"id": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2", "date": "2026-11-06", "title": "New", "url": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2"}
            result = MODULE.update_archive([fresh], path, "2026-11-07T08:00+05:30")
            saved = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(len(saved["items"]), 2)
            self.assertEqual(saved["updated_at"], "2026-11-07T08:00+05:30")
            self.assertEqual(result["items"][0]["id"], fresh["id"])

if __name__ == "__main__":
    unittest.main()
