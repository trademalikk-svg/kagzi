#!/usr/bin/env python3
"""Fetch and archive dated notices from official UPMSP and CBSE pages only."""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
UPMSP_URL = "https://www.upmsp.edu.in/"
CBSE_CIRCULARS_URL = "https://www.cbse.gov.in/cbsenew/examination_Circular.html"
UPMSP_FILE = ROOT / "board-updates/data/up-board.json"
CBSE_FILE = ROOT / "board-updates/data/cbse.json"
ALLOWED_HOSTS = {
    "up-board": ("upmsp.edu.in",),
    "cbse": ("cbse.gov.in", "cbseacademic.nic.in", "cbseresults.nic.in"),
}
DATE_RE = re.compile(r"(?<!\d)(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?!\d)")


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self.row = None
        self.cell = None
        self.link = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "tr":
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cell = {"text": "", "links": []}
        elif tag == "a" and self.cell is not None:
            self.link = {"href": attrs.get("href", ""), "text": ""}

    def handle_data(self, data):
        if self.cell is not None:
            self.cell["text"] += data
        if self.link is not None:
            self.link["text"] += data

    def handle_endtag(self, tag):
        if tag == "a" and self.link is not None and self.cell is not None:
            self.cell["links"].append(self.link)
            self.link = None
        elif tag in ("td", "th") and self.cell is not None and self.row is not None:
            self.cell["text"] = " ".join(self.cell["text"].split())
            self.row.append(self.cell)
            self.cell = None
        elif tag == "tr" and self.row is not None:
            if self.row:
                self.rows.append(self.row)
            self.row = None


def normalize_date(text: str) -> str | None:
    match = DATE_RE.search(text or "")
    if not match:
        return None
    day, month, year = map(int, match.groups())
    try:
        return datetime(year, month, day).strftime("%Y-%m-%d")
    except ValueError:
        return None


def category_for(title: str) -> str:
    value = (title or "").casefold()
    if any(word in value for word in ("result", "परिणाम", "परीक्षाफल")):
        return "result"
    if any(word in value for word in ("date sheet", "datesheet", "time table", "परीक्षा कार्यक्रम", "समय सारिणी")):
        return "date-sheet"
    if any(word in value for word in ("admit card", "admit-card", "प्रवेश पत्र", "प्रवेश-पत्र")):
        return "admit-card"
    if any(word in value for word in ("practical", "project assessment", "प्रायोगिक")):
        return "practical"
    if any(word in value for word in ("compartment", "supplementary", "कम्पार्टमेंट", "कंपार्टमेंट", "पूरक")):
        return "compartment"
    return "notice"


def official_url(board: str, base_url: str, candidate: str) -> str:
    url = urljoin(base_url, candidate or "")
    parsed = urlparse(url)
    allowed = ALLOWED_HOSTS[board]
    if parsed.scheme != "https" or not any(parsed.hostname == host or parsed.hostname.endswith("." + host) for host in allowed):
        return ""
    return url


def _parse_rows(html: str, board: str, checked_at: str) -> list[dict]:
    parser = TableParser()
    parser.feed(html)
    base_url = UPMSP_URL if board == "up-board" else CBSE_CIRCULARS_URL
    authority = "उत्तर प्रदेश माध्यमिक शिक्षा परिषद (UPMSP)" if board == "up-board" else "Central Board of Secondary Education (CBSE)"
    found = []
    for row in parser.rows:
        texts = [cell["text"] for cell in row if cell["text"]]
        date = next((normalize_date(text) for text in texts if normalize_date(text)), None)
        if not date:
            continue
        title_candidates = [
            text for text in texts
            if len(text) > 8
            and not normalize_date(text)
            and text.casefold() not in {"english", "hindi", "download", "डाउनलोड करें", "pdf"}
        ]
        if not title_candidates:
            continue
        title = max(title_candidates, key=len).strip(" |\t")
        if len(title) < 8:
            continue
        pdf_url = ""
        for cell in row:
            for link in cell["links"]:
                candidate = official_url(board, base_url, link.get("href", ""))
                if candidate and urlparse(candidate).path.casefold().endswith(".pdf"):
                    pdf_url = candidate
                    break
            if pdf_url:
                break
        digest = hashlib.sha256((board + "|" + date + "|" + " ".join(title.casefold().split())).encode("utf-8")).hexdigest()[:16]
        found.append({
            "id": f"{board}-{digest}",
            "board": board,
            "category": category_for(title),
            "title": title,
            "summary": "यह सूचना संबंधित बोर्ड की आधिकारिक वेबसाइट पर प्रकाशित है। मूल नोटिस और संलग्नक खोलने के लिए आधिकारिक लिंक देखें।",
            "publishedAt": date,
            "authority": authority,
            "officialUrl": pdf_url or base_url,
            "documentUrl": pdf_url,
            "sourceUrl": base_url,
            "lastCheckedAt": checked_at,
            "status": "current",
        })
    return found


def parse_upmsp_html(html: str, checked_at: str) -> list[dict]:
    return _parse_rows(html, "up-board", checked_at)


def parse_cbse_html(html: str, checked_at: str) -> list[dict]:
    return _parse_rows(html, "cbse", checked_at)


def merge_items(existing: list[dict], fresh: list[dict]) -> list[dict]:
    merged = list(existing or [])
    positions = {
        (item.get("board"), item.get("publishedAt"), " ".join((item.get("title") or "").casefold().split())): index
        for index, item in enumerate(merged)
    }
    for item in fresh:
        key = (item.get("board"), item.get("publishedAt"), " ".join((item.get("title") or "").casefold().split()))
        if key in positions:
            index = positions[key]
            prior = merged[index]
            merged[index] = {**prior, **{k: v for k, v in item.items() if v not in ("", None)}}
            merged[index]["id"] = prior.get("id", item["id"])
        else:
            positions[key] = len(merged)
            merged.append(item)
    return sorted(merged, key=lambda item: (item.get("publishedAt", ""), item.get("title", "")), reverse=True)


def fetch_html(url: str) -> str:
    request = Request(url, headers={"User-Agent": "KAGZI-Board-Updates/1.0 (+https://kagzi-8cy.pages.dev)"})
    with urlopen(request, timeout=20) as response:
        final_url = response.geturl()
        parsed = urlparse(final_url)
        if parsed.scheme != "https" or not any(parsed.hostname == host or parsed.hostname.endswith("." + host) for host in ALLOWED_HOSTS["cbse"] + ALLOWED_HOSTS["up-board"]):
            raise ValueError("Official source redirected outside the allowed board domains")
        return response.read().decode("utf-8", errors="replace")


def write_json_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def update_board_file(board: str, source_url: str, path: Path, parser, checked_at: str) -> int:
    html = fetch_html(source_url)
    fresh = parser(html, checked_at)
    if not fresh:
        raise ValueError(f"No dated official notices could be parsed from {source_url}; preserving existing archive")
    existing = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"items": []}
    items = merge_items(existing.get("items", []), fresh)
    payload = {
        **existing,
        "updatedAt": checked_at,
        "source": "Official " + ("UPMSP" if board == "up-board" else "CBSE") + " website",
        "sourceCheckedAt": checked_at,
        "items": items,
    }
    write_json_atomic(path, payload)
    return len(fresh)


def main() -> int:
    checked_at = datetime.now(ZoneInfo("Asia/Kolkata")).date().isoformat()
    failures = []
    jobs = [
        ("up-board", UPMSP_URL, UPMSP_FILE, parse_upmsp_html),
        ("cbse", CBSE_CIRCULARS_URL, CBSE_FILE, parse_cbse_html),
    ]
    for board, url, path, parser in jobs:
        try:
            count = update_board_file(board, url, path, parser, checked_at)
            print(f"{board}: checked {count} dated official notices")
        except Exception as exc:
            failures.append(f"{board}: {exc}")
            print(f"{board}: {exc}")
    if len(failures) == len(jobs):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
