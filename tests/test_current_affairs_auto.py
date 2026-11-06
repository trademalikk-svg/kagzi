import importlib.util
import unittest
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


if __name__ == "__main__":
    unittest.main()
