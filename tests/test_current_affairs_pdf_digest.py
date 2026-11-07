import unittest
from scripts.current_affairs_pdf_content import build_pib_digest_fragment


class PIBPDFDigestTests(unittest.TestCase):
    def setUp(self):
        self.items = [
            {"id":"1","date":"2026-11-07","title":"नई योजना <विशेष>","description":"विवरण & जानकारी","category":"शासन","url":"https://www.pib.gov.in/PressReleasePage.aspx?PRID=1"},
            {"id":"2","date":"2026-11-03","title":"पुराना साप्ताहिक अपडेट","description":"विवरण","category":"खेल","url":"https://www.pib.gov.in/PressReleasePage.aspx?PRID=2"},
            {"id":"3","date":"2026-10-25","title":"सीमा से बाहर की तारीख","description":"पुराना","category":"खेल","url":"https://www.pib.gov.in/PressReleasePage.aspx?PRID=3"},
            {"id":"4","date":"2026-11-07","title":"अनधिकृत लिंक","description":"इसे शामिल न करें","category":"x","url":"https://example.com/not-pib"},
        ]

    def test_daily_digest_includes_only_today_and_escapes_untrusted_text(self):
        fragment = build_pib_digest_fragment(self.items, "daily", "2026-11-07")
        self.assertIn("नई योजना &lt;विशेष&gt;", fragment)
        self.assertIn("विवरण &amp; जानकारी", fragment)
        self.assertNotIn("पुराना साप्ताहिक अपडेट", fragment)
        self.assertNotIn("अनधिकृत लिंक", fragment)
        self.assertIn("https://www.pib.gov.in/PressReleasePage.aspx?PRID=1", fragment)

    def test_weekly_digest_includes_last_seven_days_only(self):
        fragment = build_pib_digest_fragment(self.items, "weekly", "2026-11-07")
        self.assertIn("नई योजना", fragment)
        self.assertIn("पुराना साप्ताहिक अपडेट", fragment)
        self.assertNotIn("सीमा से बाहर की तारीख", fragment)

    def test_empty_digest_is_safe_and_does_not_create_fake_news(self):
        self.assertEqual(build_pib_digest_fragment([], "daily", "2026-11-07"), "")

    def test_unknown_mode_is_rejected(self):
        with self.assertRaises(ValueError):
            build_pib_digest_fragment(self.items, "monthly", "2026-11-07")


if __name__ == "__main__":
    unittest.main()
