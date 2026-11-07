#!/usr/bin/env python3
"""Publish scheme-related official PIB Hindi releases to KAGZI."""
from __future__ import annotations
import email.utils, hashlib, html, json, os, re, sys, tempfile
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"government-schemes"/"data"/"updates.json"
FEED_URL="https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3"
IST=ZoneInfo("Asia/Kolkata")
KEYWORDS=("योजना","लाभार्थी","सब्सिडी","पेंशन","छात्रवृत्ति","किसान सम्मान","आवास योजना","scheme","beneficiary","subsidy","scholarship","pension","pm-kisan","pm kisan","ujjwala","ayushman","मिशन शक्ति","जनधन")

def local_name(tag): return tag.rsplit("}",1)[-1].lower()
def child_text(node,wanted):
    for child in list(node):
        if local_name(child.tag)==wanted.lower(): return (child.text or "").strip()
    return ""
def clean(value):
    return re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]*>"," ",value or ""))).strip()
def official(url):
    try:
        p=urlparse(url)
        return p.scheme=="https" and ((p.hostname or "").lower()=="pib.gov.in" or (p.hostname or "").lower().endswith(".pib.gov.in"))
    except ValueError: return False
def parse_feed(payload, checked_at=None):
    root=ET.fromstring(payload); by_url={}
    for node in root.iter():
        if local_name(node.tag)!="item": continue
        title=clean(child_text(node,"title")); link=child_text(node,"link")
        desc=clean(child_text(node,"description"))
        raw_date=child_text(node,"pubdate") or child_text(node,"date")
        try:
            dt=email.utils.parsedate_to_datetime(raw_date)
            if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
            date=dt.astimezone(IST).date().isoformat()
        except (TypeError,ValueError,OverflowError): continue
        text=(title+" "+desc).lower()
        if not title or not official(link) or not any(k in text for k in KEYWORDS): continue
        by_url[link]={"id":hashlib.sha256(link.encode()).hexdigest()[:20],"date":date,"title":title[:400],"description":desc[:700],"source":"पत्र सूचना कार्यालय (PIB)","url":link}
    return sorted(by_url.values(),key=lambda x:(x["date"],x["title"]),reverse=True)
def write_atomic(path,payload):
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(prefix=path.name+".",suffix=".tmp",dir=str(path.parent))
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as f:
            json.dump(payload,f,ensure_ascii=False,indent=2); f.write("\n"); f.flush(); os.fsync(f.fileno())
        os.replace(tmp,path)
    except Exception:
        try: os.unlink(tmp)
        except FileNotFoundError: pass
        raise
def update(incoming,path=OUTPUT,checked_at=None):
    if not incoming: raise RuntimeError("No dated, scheme-related official PIB items; preserving the previous scheme update feed.")
    old={"items":[]}
    if path.exists(): old=json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(old,dict) or not isinstance(old.get("items",[]),list): raise ValueError("Existing scheme update archive is invalid; preserving it.")
    merged={x.get("url"):x for x in old.get("items",[]) if x.get("url")}
    merged.update({x["url"]:x for x in incoming})
    result={"updatedAt":checked_at or datetime.now(IST).isoformat(timespec="minutes"),"timezone":"Asia/Kolkata","sourceName":"PIB Hindi RSS","sourceUrl":FEED_URL,"scope":"केवल PIB में प्रकाशित योजना-संबंधी आधिकारिक विज्ञप्तियाँ","items":sorted(merged.values(),key=lambda x:(x["date"],x["title"]),reverse=True)[:300]}
    write_atomic(path,result); return result
def fetch():
    req=urllib.request.Request(FEED_URL,headers={"User-Agent":"KAGZI-Scheme-Updates/1.0"})
    with urllib.request.urlopen(req,timeout=30) as res:
        if not official(res.geturl()): raise ValueError("PIB feed redirected outside official domain.")
        return res.read(5_000_000)
def main():
    incoming=parse_feed(fetch())
    result=update(incoming)
    print(f"Published {len(incoming)} new/updated official scheme-related PIB entries; {len(result['items'])} retained.")
if __name__=="__main__":
    try: main()
    except Exception as exc:
        print(f"Scheme update failed: {exc}",file=sys.stderr); raise SystemExit(1)
