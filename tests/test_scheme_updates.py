import tempfile
import unittest
from pathlib import Path
from scripts.update_scheme_updates import parse_feed, update

XML="""<?xml version="1.0"?><rss><channel>
<item><title>प्रधानमंत्री किसान योजना के लाभार्थियों के लिए सूचना</title><link>https://pib.gov.in/PressReleasePage.aspx?PRID=123</link><description>किसान योजना के बारे में आधिकारिक सूचना</description><pubDate>Sat, 07 Nov 2026 08:00:00 +0530</pubDate></item>
<item><title>Unrelated sports update</title><link>https://pib.gov.in/PressReleasePage.aspx?PRID=124</link><description>Sports</description><pubDate>Sat, 07 Nov 2026 08:00:00 +0530</pubDate></item>
<item><title>Fake redirect item</title><link>https://example.com/notice</link><description>scheme beneficiary</description><pubDate>Sat, 07 Nov 2026 08:00:00 +0530</pubDate></item>
</channel></rss>""".encode("utf-8")

class SchemeUpdatesTests(unittest.TestCase):
    def test_only_official_scheme_related_items_are_selected(self):
        items=parse_feed(XML)
        self.assertEqual(len(items),1)
        self.assertIn("किसान योजना",items[0]["title"])
        self.assertTrue(items[0]["url"].startswith("https://pib.gov.in/"))
    def test_empty_update_does_not_replace_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"updates.json"
            path.write_text('{"items":[{"url":"keep"}]}',encoding="utf-8")
            with self.assertRaises(RuntimeError): update([],path)
            self.assertIn("keep",path.read_text(encoding="utf-8"))
    def test_update_writes_deduplicated_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"updates.json"
            item=parse_feed(XML)[0]
            result=update([item,item],path,checked_at="2026-11-07T09:15+05:30")
            self.assertEqual(len(result["items"]),1)
            self.assertTrue(path.exists())

if __name__=="__main__": unittest.main()
