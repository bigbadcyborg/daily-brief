"""High-impact U.S. releases for the local day, from the Forex Factory weekly feed."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from brieflib.net import UpstreamError, cache_get, cache_set, fetch_json

FEED = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"


def get_prints(day: str, offset: int) -> dict:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day or ""):
        raise UpstreamError("That day is off.")
    try:
        target = datetime.fromisoformat(day).date()
        offset = int(offset)
    except ValueError as exc:
        raise UpstreamError("That day is off.") from exc
    offset = max(-14 * 60, min(14 * 60, offset))
    chosen = []
    for row in _feed():
        if not _wanted(row):
            continue
        local = _local(row.get("date"), offset)
        if local is None or local.date() != target:
            continue
        chosen.append({
            "time": _clock(local),
            "title": str(row.get("title") or "").strip(),
            "forecast": str(row.get("forecast") or "").strip(),
            "previous": str(row.get("previous") or "").strip(),
            "impact": row.get("impact") or "",
            "sort": local.hour * 60 + local.minute,
        })
    chosen.sort(key=lambda item: (0 if item["impact"] in {"High", "Holiday"} else 1, item["sort"], item["title"]))
    highs = [item for item in chosen if item["impact"] in {"High", "Holiday"}]
    mediums = [item for item in chosen if item["impact"] == "Medium"]
    items = []
    for item in (highs + mediums)[:8]:
        items.append({
            "time": item["time"],
            "title": item["title"],
            "forecast": item["forecast"],
            "previous": item["previous"],
        })
    return {"day": day, "items": items}


def _wanted(row: dict) -> bool:
    country = row.get("country") or ""
    impact = row.get("impact") or ""
    title = str(row.get("title") or "").lower()
    if impact == "Holiday" and country == "USD":
        return True
    if country != "USD":
        return False
    if impact == "High":
        return True
    return impact == "Medium" and "speak" not in title


def _feed() -> list:
    cached = cache_get("prints:feed")
    if isinstance(cached, list):
        return cached
    data = fetch_json(FEED)
    if not isinstance(data, list):
        raise UpstreamError("The calendar didn't load.")
    cache_set("prints:feed", data, 1800)
    return data


def _local(stamp, offset: int) -> datetime | None:
    if not isinstance(stamp, str) or not stamp:
        return None
    try:
        parsed = datetime.fromisoformat(stamp)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed
    return parsed.astimezone(timezone.utc) - timedelta(minutes=offset)


def _clock(local: datetime) -> str:
    hour = local.hour
    suffix = "a" if hour < 12 else "p"
    shown = hour % 12 or 12
    if local.minute:
        return f"{shown}:{local.minute:02d}{suffix}"
    return f"{shown}{suffix}"
