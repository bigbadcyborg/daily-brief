"""Headlines from Google News RSS. Titles and links only — the desk stays scannable."""

from __future__ import annotations

import html
import re
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

from brieflib.net import UpstreamError, cache_get, cache_set, fetch

TOPICS = {
    "world": ("WORLD", "World"),
    "business": ("BUSINESS", "Business"),
    "tech": ("TECHNOLOGY", "Technology"),
}

_TAGS = re.compile(r"<[^>]+>")
_PRICE_NOISE = re.compile(r"current price of bitcoin|bitcoin price today$", re.I)


def get_news(
    *,
    topic: str | None = None,
    symbol: str | None = None,
    query: str | None = None,
    window: str = "today",
) -> dict:
    window = "week" if window == "week" else "today"
    if topic in TOPICS:
        code, title = TOPICS[topic]
        key = f"news:topic:{topic}"
        url = (
            "https://news.google.com/rss/headlines/section/topic/"
            f"{code}?hl=en-US&gl=US&ceid=US:en"
        )
        limit = 5
        apply_window = False
    elif topic == "bitcoin":
        span = "7d" if window == "week" else "1d"
        key = f"news:btc:{window}"
        title = "Bitcoin"
        query = urllib.parse.quote(f"bitcoin when:{span}")
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
        limit = 4
        apply_window = True
    elif symbol:
        span = "7d" if window == "week" else "1d"
        symbol = symbol.strip().upper()
        if not re.fullmatch(r"[A-Z0-9^=.\-]{1,16}", symbol):
            raise UpstreamError("That symbol isn't usable.")
        key = f"news:sym:{symbol}:{window}"
        title = symbol
        query = urllib.parse.quote(f"{symbol} stock when:{span}")
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
        limit = 4
        apply_window = True
    elif query:
        query = re.sub(r"\s+", " ", query).strip()
        if not query or len(query) > 80 or not re.search(r"[A-Za-z0-9]", query):
            raise UpstreamError("That search isn't usable.")
        span = "7d" if window == "week" else "1d"
        key = f"news:q:{window}:{query.lower()}"
        title = query
        encoded = urllib.parse.quote(f"{query} when:{span}")
        url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"
        limit = 5
        apply_window = True
    else:
        raise UpstreamError("Say which headlines you want.")

    cached = cache_get(key)
    if cached is not None:
        return cached

    code, body = fetch(url, headers={"Accept": "application/rss+xml, application/xml, text/xml"})
    if code != 200:
        raise UpstreamError("Headlines didn't load.")
    items = _items(body)
    note = None
    if apply_window:
        hours = 24 * 8 if window == "week" else 36
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        fresh = [item for item in items if item["published_dt"] and item["published_dt"] >= cutoff]
        if len(fresh) >= 3:
            items = fresh
        elif window == "today":
            note = "Quiet tape — showing the latest."
    payload = {
        "title": title,
        "note": note,
        "items": [
            {
                "title": item["title"],
                "source": item["source"],
                "url": item["url"],
                "published": item["published"],
            }
            for item in _diverse(items, limit)
        ],
    }
    cache_set(key, payload, 180)
    return payload


def _items(body: bytes) -> list[dict]:
    try:
        root = ET.fromstring(body)
    except ET.ParseError as exc:
        raise UpstreamError("Headlines didn't load.") from exc
    rows = []
    seen: set[str] = set()
    for node in root.iter("item"):
        title = _clean(node.findtext("title") or "")
        url = _clean(node.findtext("link") or "")
        if not title or not url.startswith("http"):
            continue
        source_node = node.find("source")
        source = _clean(source_node.text or "") if source_node is not None and source_node.text else ""
        for sep in (" - ", " — ", " – "):
            if source and title.endswith(sep + source):
                title = title[: -(len(sep) + len(source))].strip()
                break
        if not source and " - " in title:
            title, source = (part.strip() for part in title.rsplit(" - ", 1))
        if not title or _PRICE_NOISE.search(title):
            continue
        key = re.sub(r"[^a-z0-9]+", "", title.lower())[:80]
        if not key or key in seen:
            continue
        seen.add(key)
        published_dt = _when(node.findtext("pubDate") or "")
        rows.append({
            "title": title,
            "source": source or "News",
            "url": url,
            "published": published_dt.isoformat() if published_dt else None,
            "published_dt": published_dt,
        })
    rows.sort(
        key=lambda item: item["published_dt"] or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return rows


_NOISE = set(
    """
    a an the of to for in on and with from as at by or is are was were be
    over into about after before new says said after its his her their
    """.split()
)


def _diverse(items: list[dict], limit: int) -> list[dict]:
    kept = []
    for item in items:
        if any(_similar(item["title"], prev["title"]) for prev in kept):
            continue
        kept.append(item)
        if len(kept) >= limit:
            break
    return kept


def _tokens(title: str) -> set[str]:
    return {
        word
        for word in re.findall(r"[a-z0-9]+", title.lower())
        if len(word) > 2 and word not in _NOISE
    }


def _similar(left: str, right: str) -> bool:
    first = _tokens(left)
    second = _tokens(right)
    if len(first) < 3 or len(second) < 3:
        return False
    shared = len(first & second)
    if shared < 3:
        return False
    if first <= second or second <= first:
        return True
    return shared / len(first | second) >= 0.55


def _clean(value: str) -> str:
    value = html.unescape(value or "")
    value = _TAGS.sub("", value)
    return re.sub(r"\s+", " ", value).strip()


def _when(value: str) -> datetime | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError, IndexError, OverflowError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
