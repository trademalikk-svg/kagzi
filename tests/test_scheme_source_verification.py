import unittest
from scripts.verify_scheme_sources import allowed_url,build_status
class Tests(unittest.TestCase):
 def test_domain_allowlist(self):
  self.assertTrue(allowed_url("https://pmkisan.gov.in/")); self.assertTrue(allowed_url("https://x.nic.in/")); self.assertFalse(allowed_url("http://pmkisan.gov.in/")); self.assertFalse(allowed_url("https://example.com/"))
 def test_changed_page_needs_review(self):
  reg={"sources":[{"id":"a","name":"A","url":"https://x.gov.in/"}]}; old={"sources":[{"id":"a","content_hash":"old"}]}
  r=build_status(reg,old,lambda u:{"http_status":200,"final_url":u,"content_hash":"new","bytes_checked":3,"content_type":"text/html"},"2026-11-07T09:30+05:30")
  self.assertEqual(r["changed_count"],1); self.assertEqual(r["sources"][0]["source_change_review"],"review_required"); self.assertEqual(r["sources"][0]["eligibility_review"],"manual_official_guideline_review_required")
 def test_stable_page_is_not_called_eligibility_verified(self):
  reg={"sources":[{"id":"a","name":"A","url":"https://x.gov.in/"}]}; old={"sources":[{"id":"a","content_hash":"same"}]}
  r=build_status(reg,old,lambda u:{"http_status":200,"final_url":u,"content_hash":"same","bytes_checked":3,"content_type":"text/html"},"2026-11-07T09:30+05:30")
  self.assertEqual(r["sources"][0]["eligibility_review"],"manual_official_guideline_review_required")
 def test_unavailable_source(self):
  reg={"sources":[{"id":"a","name":"A","url":"https://x.gov.in/"}]}
  r=build_status(reg,{"sources":[]},lambda u:(_ for _ in ()).throw(RuntimeError("offline")),"2026-11-07T09:30+05:30")
  self.assertEqual(r["unavailable_count"],1)
if __name__=="__main__":unittest.main()
