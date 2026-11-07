#!/usr/bin/env python3
"""Monitor official scheme source availability and detect changes; never certify eligibility automatically."""
from __future__ import annotations
import hashlib,json,os,sys,tempfile
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request,urlopen
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]
REGISTRY=ROOT/"government-schemes/data/verification-sources.json"
OUTPUT=ROOT/"government-schemes/data/verification-status.json"
IST=ZoneInfo("Asia/Kolkata")
def allowed_url(url):
    try:
        p=urlparse(url); h=(p.hostname or "").lower()
        return p.scheme=="https" and (h=="gov.in" or h.endswith(".gov.in") or h=="nic.in" or h.endswith(".nic.in"))
    except ValueError:return False
def fetch_source(url):
    if not allowed_url(url):raise ValueError("URL is not an allowed official government domain")
    req=Request(url,headers={"User-Agent":"KAGZI-Official-Scheme-Source-Checker/1.0","Accept":"text/html,application/xhtml+xml,application/json,*/*"})
    with urlopen(req,timeout=25) as r:
        final=r.geturl()
        if not allowed_url(final):raise ValueError("Redirect left official government domains")
        body=r.read(1500000)
        return {"http_status":r.status,"final_url":final,"content_hash":hashlib.sha256(body).hexdigest(),"bytes_checked":len(body),"content_type":r.headers.get("Content-Type","")}
def build_status(registry,previous,fetcher=fetch_source,checked_at=None):
    old={x.get("id"):x for x in previous.get("sources",[]) if x.get("id")}; rows=[]
    for s in registry.get("sources",[]):
        p=old.get(s["id"],{}); row={"id":s["id"],"name":s["name"],"url":s["url"],"checked_at":checked_at,"eligibility_review":"manual_official_guideline_review_required"}
        try:
            now=fetcher(s["url"]); changed=bool(p.get("content_hash") and p["content_hash"]!=now["content_hash"])
            row.update(now); row.update({"availability":"available","change_detected":changed,"first_baseline":not bool(p.get("content_hash")),"source_change_review":"review_required" if changed else ("baseline_created" if not p.get("content_hash") else "no_content_change_detected"),"last_content_change_at":checked_at if changed or not p.get("content_hash") else p.get("last_content_change_at")})
        except Exception as e:
            row.update({"availability":"unavailable","change_detected":False,"source_change_review":"source_unavailable","error":str(e)[:240],"content_hash":p.get("content_hash"),"last_content_change_at":p.get("last_content_change_at")})
        rows.append(row)
    a=sum(x["availability"]=="available" for x in rows); c=sum(bool(x.get("change_detected")) for x in rows); u=len(rows)-a
    return {"checked_at":checked_at or datetime.now(IST).isoformat(timespec="minutes"),"timezone":"Asia/Kolkata","source_count":len(rows),"available_count":a,"changed_count":c,"unavailable_count":u,"overall_status":"review_required" if c or u else "sources_reachable_content_stable","important_note":"यह रिपोर्ट केवल सरकारी स्रोतों की उपलब्धता और पेज-सामग्री में बदलाव जाँचती है। पात्रता, लाभ, दस्तावेज़ और आवेदन नियम तभी सत्यापित माने जाएँ जब संबंधित नवीनतम आधिकारिक दिशानिर्देश की मानवीय समीक्षा पूरी हो।","sources":rows}
def write_atomic(path,payload):
    path.parent.mkdir(parents=True,exist_ok=True); fd,tmp=tempfile.mkstemp(prefix=path.name+".",suffix=".tmp",dir=str(path.parent))
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as f:json.dump(payload,f,ensure_ascii=False,indent=2); f.write("\n"); f.flush(); os.fsync(f.fileno())
        os.replace(tmp,path)
    except Exception:
        try:os.unlink(tmp)
        except FileNotFoundError:pass
        raise
def main():
    registry=json.loads(REGISTRY.read_text(encoding="utf-8")); previous=json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {"sources":[]}
    result=build_status(registry,previous); write_atomic(OUTPUT,result)
    print("Checked %s sources: %s available, %s changed, %s unavailable."%(result["source_count"],result["available_count"],result["changed_count"],result["unavailable_count"]))
if __name__=="__main__":
    try:main()
    except Exception as e:print("Scheme source verification failed: "+str(e),file=sys.stderr); raise SystemExit(1)
