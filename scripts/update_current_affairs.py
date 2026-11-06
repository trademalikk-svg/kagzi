#!/usr/bin/env python3
"""Collect official PIB Hindi RSS releases into a durable static JSON archive."""
from __future__ import annotations

import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "current-affairs" / "data" / "items.json"
FEED_URL = "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3"
IST = ZoneInfo("Asia/Kolkata")
MAX_ITEMS = 10000

CATEGORY_RULES = [
    ("अर्थव्यवस्था", ("अर्थव्यवस्था", "बैंक", "बजट", "कर", "निर्यात", "आयात", "महंगाई", "जीएसटी", "gdp", "economy", "finance", "tax", "bank", "trade")),
    ("विज्ञान एवं तकनीक", ("विज्ञान", "तकनीक", "अंतरिक्ष", "इसरो", "ai", "कृत्रिम बुद्धिमत्ता", "वैज्ञानिक", "science", "technology", "space", "isro", "research")),
    ("पर्यावरण", ("पर्यावरण", "जलवायु", "वन्यजीव", "जैव विविधता", "जल संरक्षण", "environment", "climate", "wildlife", "biodiversity")),
    ("शासन एवं योजनाएँ", ("योजना", "मंत्रालय", "सरकार", "नीति", "अधिनियम", "कैबिनेट", "governance", "scheme", "ministry", "policy", "cabinet")),
    ("रक्षा एवं सुरक्षा", ("रक्षा", "सेना", "नौसेना", "वायुसेना", "सीमा", "defence", "defense", "army", "navy", "air force")),
    ("अंतरराष्ट्रीय", ("अंतरराष्ट्रीय", "विदेश", "संयुक्त राष्ट्र", "द्विपक्षीय", "international", "united nations", "bilateral")),
    ("खेल", ("खेल", "पदक", "टूर्नामेंट", "विश्व कप", "sports", "medal", "tournament", "championship")),
    ("उत्तर प्रदेश विशेष", ("उत्तर प्रदेश", "लखनऊ", "प्रयागराज", "वाराणसी", "कानपुर", "बरेली", "up government", "uttar pradesh")),
]

def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()

def child_text(node: ET.Element, wanted: str) -> str:
    for child in list(node):
        if local_name(child.tag) == wanted.lower():
            return (child.text or "").strip()
    return ""

def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]*>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()

def parse_date(value: str) -> str | None:
    if not value:
        return None
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(IST).date().isoformat()
    except (TypeError, ValueError, OverflowError):
        return None

def category_for(title: str, description: str) -> str:
    text = (title + " " + description).lower()
    for category, words in CATEGORY_RULES:
        if any(word in text for word in words):
            return category
    return "राष्ट्रीय घटनाक्रम"

def parse_feed(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    items = []
    for node in root.iter():
        if local_name(node.tag) != "item":
            continue
        title = clean_text(child_text(node, "title"))
        link = child_text(node, "link")
        description = clean_text(child_text(node, "description"))
        pub_date = child_text(node, "pubdate") or child_text(node, "date")
        date = parse_date(pub_date)
        if not title or not date or not link.startswith("https://"):
            continue
        if not re.match(r"^https://([a-z0-9-]+\.)*pib\.gov\.in/", link, re.I):
            continue
        items.append({
            "id": link,
            "date": date,
            "title": title[:500],
            "description": description[:700],
            "category": category_for(title, description),
            "source": "पत्र सूचना कार्यालय (PIB)",
            "url": link,
        })
    return items

def main() -> int:
    request = urllib.request.Request(FEED_URL, headers={"User-Agent": "KAGZI-Current-Affairs-Bot/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read(5_000_000)
    incoming = parse_feed(payload)
    if not incoming:
        raise RuntimeError("PIB RSS returned no valid dated items; keeping the previous archive unchanged.")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    existing = {"items": []}
    if OUTPUT.exists():
        existing = json.loads(OUTPUT.read_text(encoding="utf-8"))
    by_id = {item.get("id") or item.get("url"): item for item in existing.get("items", [])}
    for item in incoming:
        by_id[item["id"]] = item

    all_items = sorted(by_id.values(), key=lambda item: (item.get("date", ""), item.get("title", "")), reverse=True)[:MAX_ITEMS]
    result = {
        "updated_at": datetime.now(IST).isoformat(timespec="minutes"),
        "timezone": "Asia/Kolkata",
        "source": FEED_URL,
        "source_name": "PIB Hindi RSS",
        "items": all_items,
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(all_items)} unique PIB items; fetched {len(incoming)} items.")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Current Affairs update failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
