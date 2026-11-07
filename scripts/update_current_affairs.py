#!/usr/bin/env python3
"""Collect official PIB Hindi RSS releases into a durable static JSON archive."""
from __future__ import annotations

import email.utils
import html
import json
import os
import re
import sys
import tempfile
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
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


def is_official_pib_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
    except ValueError:
        return False
    host = (parsed.hostname or "").lower()
    return parsed.scheme == "https" and (host == "pib.gov.in" or host.endswith(".pib.gov.in"))


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
    by_url = {}
    for node in root.iter():
        if local_name(node.tag) != "item":
            continue
        title = clean_text(child_text(node, "title"))
        link = child_text(node, "link")
        description = clean_text(child_text(node, "description"))
        pub_date = child_text(node, "pubdate") or child_text(node, "date")
        date = parse_date(pub_date)
        if not title or not date or not is_official_pib_url(link):
            continue
        by_url[link] = {
            "id": link,
            "date": date,
            "title": title[:500],
            "description": description[:700],
            "category": category_for(title, description),
            "source": "पत्र सूचना कार्यालय (PIB)",
            "url": link,
        }
    return sorted(by_url.values(), key=lambda item: (item["date"], item["title"]), reverse=True)


def merge_items(existing_items: list[dict], incoming_items: list[dict]) -> list[dict]:
    by_id = {}
    for item in list(existing_items or []) + list(incoming_items or []):
        key = item.get("id") or item.get("url")
        if key:
            by_id[key] = item
    return sorted(by_id.values(), key=lambda item: (item.get("date", ""), item.get("title", "")), reverse=True)[:MAX_ITEMS]


def write_json_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def update_archive(incoming: list[dict], output_path: Path = OUTPUT, updated_at: str | None = None) -> dict:
    if not incoming:
        raise RuntimeError("PIB RSS returned no valid dated official items; keeping the previous archive unchanged.")
    existing = {"items": []}
    if output_path.exists():
        existing = json.loads(output_path.read_text(encoding="utf-8"))
    if not isinstance(existing, dict) or not isinstance(existing.get("items", []), list):
        raise ValueError("Existing Current Affairs archive has an invalid structure; preserving it.")
    all_items = merge_items(existing.get("items", []), incoming)
    result = {
        **existing,
        "updated_at": updated_at or datetime.now(IST).isoformat(timespec="minutes"),
        "timezone": "Asia/Kolkata",
        "source": FEED_URL,
        "source_name": "PIB Hindi RSS",
        "items": all_items,
    }
    write_json_atomic(output_path, result)
    return result


def fetch_feed() -> bytes:
    request = urllib.request.Request(FEED_URL, headers={"User-Agent": "KAGZI-Current-Affairs-Bot/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        final_url = response.geturl()
        if not is_official_pib_url(final_url):
            raise ValueError("PIB RSS redirected outside the official PIB domain; archive not changed.")
        return response.read(5_000_000)


def main() -> int:
    payload = fetch_feed()
    incoming = parse_feed(payload)
    result = update_archive(incoming, OUTPUT)
    print(f"Saved {len(result['items'])} unique PIB items; fetched {len(incoming)} valid items.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Current Affairs update failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
