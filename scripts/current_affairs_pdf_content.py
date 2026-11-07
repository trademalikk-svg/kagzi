"""Safe HTML fragments for source-linked PIB RSS digests in Hindi PDFs."""
from __future__ import annotations

from datetime import date, timedelta
from html import escape
from urllib.parse import urlparse
import re


def _valid_item(item: dict) -> bool:
    url = item.get("url", "")
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    try:
        date.fromisoformat(item.get("date", ""))
    except ValueError:
        return False
    return (
        parsed.scheme == "https"
        and (host == "pib.gov.in" or host.endswith(".pib.gov.in"))
        and bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", item.get("date", "")))
        and bool(item.get("title"))
    )


def build_pib_digest_fragment(items: list[dict], mode: str, today: str) -> str:
    if mode not in {"daily", "weekly"}:
        raise ValueError("mode must be 'daily' or 'weekly'")
    current = date.fromisoformat(today)
    if mode == "daily":
        selected = [item for item in items if _valid_item(item) and item["date"] == today]
        heading = "आज की PIB आधिकारिक विज्ञप्तियाँ"
        label = "DAILY OFFICIAL PIB DIGEST"
    else:
        start = current - timedelta(days=6)
        selected = [
            item for item in items
            if _valid_item(item) and start <= date.fromisoformat(item["date"]) <= current
        ]
        heading = "सप्ताह की PIB आधिकारिक विज्ञप्तियाँ"
        label = "WEEKLY OFFICIAL PIB DIGEST"
    if not selected:
        return ""
    selected.sort(key=lambda item: (item["date"], item["title"]), reverse=True)
    blocks = []
    for item in selected:
        title = escape(str(item.get("title", "")))
        description = escape(str(item.get("description", "")))
        category = escape(str(item.get("category", "राष्ट्रीय घटनाक्रम")))
        link = escape(str(item.get("url", "")), quote=True)
        published = escape(str(item["date"]))
        blocks.append(
            '<article class="news pib-news">'
            f'<span class="tag">{category} · {published}</span>'
            f'<h3>{title}</h3>'
            + (f'<p>{description}</p>' if description else "")
            + f'<p><a href="{link}" target="_blank" rel="noopener noreferrer">मूल PIB विज्ञप्ति पढ़ें ↗</a></p>'
            + '</article>'
        )
    return (
        '<section class="chapter" id="pib-official-digest">'
        f'<div class="label">{label}</div><h2>{heading}</h2>'
        '<p>नीचे PIB की आधिकारिक हिंदी RSS सूची से प्राप्त शीर्षक और संक्षिप्त विवरण दिए गए हैं। '
        'मूल विज्ञप्ति के लिए स्रोत लिंक खोलें; यह RSS सारांश स्वतंत्र रूप से विस्तारित समाचार लेख नहीं है।</p>'
        + "".join(blocks)
        + f'<p class="muted">इस अनुभाग में {len(selected)} आधिकारिक रिकॉर्ड शामिल हैं।</p></section>'
    )
