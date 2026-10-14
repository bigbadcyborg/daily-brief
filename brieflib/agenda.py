"""Today's events from an ICS feed the user pastes in."""

from __future__ import annotations

import ipaddress
import re
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlparse

from brieflib.net import UpstreamError, cache_get, cache_set, fetch

_WEEK = {"MO": 0, "TU": 1, "WE": 2, "TH": 3, "FR": 4, "SA": 5, "SU": 6}


def get_agenda(url: str, day: str, offset: int) -> dict:
    cleaned = clean_feed(url)
    if not cleaned:
        raise UpstreamError("Use an https calendar link.")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day or ""):
        raise UpstreamError("That day is off.")
    try:
        target = date.fromisoformat(day)
        offset = max(-14 * 60, min(14 * 60, int(offset)))
    except ValueError as exc:
        raise UpstreamError("That day is off.") from exc
    key = f"ics:{cleaned}:{day}:{offset}"
    cached = cache_get(key)
    if isinstance(cached, dict):
        return cached
    code, body = fetch(cleaned, headers={"Accept": "text/calendar, text/plain, */*"}, timeout=8)
    if code != 200:
        raise UpstreamError("That calendar didn't load.")
    if len(body) > 1_000_000:
        raise UpstreamError("That calendar is too large.")
    text = body.decode("utf-8", "replace")
    payload = {"items": events_from_ics(text, target, offset)[:8]}
    cache_set(key, payload, 600)
    return payload


def clean_feed(value: str | None) -> str | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if text.lower().startswith("webcal://"):
        text = "https://" + text[9:]
    if len(text) > 500 or not text.lower().startswith("https://"):
        return None
    parsed = urlparse(text)
    host = (parsed.hostname or "").strip(".").lower()
    if not host or parsed.username or parsed.password:
        return None
    if host in {"localhost", "127.0.0.1", "::1"} or host.endswith(".local"):
        return None
    try:
        if not ipaddress.ip_address(host).is_global:
            return None
    except ValueError:
        pass
    return text


def events_from_ics(text: str, target: date, offset: int) -> list[dict]:
    events = []
    for block in _events(_unfold(text)):
        summary = _field(block, "SUMMARY")
        if not summary:
            continue
        start, all_day = _start(block, offset)
        if start is None:
            continue
        rule = _rule(block)
        if rule:
            if not _occurs(start.date(), rule, target):
                continue
        elif start.date() != target:
            continue
        events.append({
            "time": "All day" if all_day else _clock(start),
            "title": summary,
            "sort": -1 if all_day else start.hour * 60 + start.minute,
        })
    events.sort(key=lambda item: (item["sort"], item["title"]))
    return [{"time": item["time"], "title": item["title"]} for item in events]


def _unfold(text: str) -> str:
    return re.sub(r"\r?\n[ \t]", "", text.replace("\r\n", "\n"))


def _events(text: str) -> list[str]:
    return re.findall(r"BEGIN:VEVENT\n(.*?)\nEND:VEVENT", text, flags=re.S)


def _field(block: str, name: str) -> str:
    match = re.search(rf"^{name}(?:;[^:]*)?:(.*)$", block, flags=re.M)
    if not match:
        return ""
    return re.sub(r"\\n", " ", match.group(1)).replace("\\,", ",").replace("\\;", ";").strip()


def _start(block: str, offset: int) -> tuple[datetime | None, bool]:
    match = re.search(r"^DTSTART(?:;([^:]*))?:(.*)$", block, flags=re.M)
    if not match:
        return None, False
    params = match.group(1) or ""
    value = match.group(2).strip()
    all_day = "VALUE=DATE" in params.upper() or re.fullmatch(r"\d{8}", value) is not None
    if all_day and re.fullmatch(r"\d{8}", value):
        parsed = datetime(int(value[0:4]), int(value[4:6]), int(value[6:8]))
        return parsed, True
    found = re.fullmatch(r"(\d{8})T(\d{6})(Z)?", value)
    if not found:
        return None, False
    parsed = datetime(
        int(value[0:4]), int(value[4:6]), int(value[6:8]),
        int(value[9:11]), int(value[11:13]), int(value[13:15]),
    )
    if value.endswith("Z"):
        parsed = parsed.replace(tzinfo=timezone.utc) - timedelta(minutes=offset)
        parsed = parsed.replace(tzinfo=None)
    return parsed, False


def _rule(block: str) -> dict | None:
    raw = _field(block, "RRULE")
    if not raw:
        return None
    rule = {}
    for part in raw.split(";"):
        if "=" in part:
            key, value = part.split("=", 1)
            rule[key.upper()] = value
    return rule or None


def _occurs(start: date, rule: dict, target: date) -> bool:
    freq = (rule.get("FREQ") or "").upper()
    try:
        interval = max(1, int(rule.get("INTERVAL") or 1))
    except ValueError:
        interval = 1
    if target < start:
        return False
    until = _until(rule.get("UNTIL") or "")
    if until and target > until:
        return False
    if freq == "DAILY":
        delta = (target - start).days
        if delta % interval != 0:
            return False
        return _within_count(delta // interval, rule)
    if freq == "WEEKLY":
        wanted = set()
        for part in (rule.get("BYDAY") or "").split(","):
            code = part.strip()[-2:].upper()
            if code in _WEEK:
                wanted.add(_WEEK[code])
        if not wanted:
            wanted.add(start.weekday())
        if target.weekday() not in wanted:
            return False
        weeks = (target - start).days // 7
        if weeks % interval != 0:
            return False
        if "COUNT" not in rule:
            return True
        seen = 0
        cursor = start
        while cursor <= target:
            if cursor.weekday() in wanted and ((cursor - start).days // 7) % interval == 0:
                seen += 1
                if cursor == target:
                    return _within_count(seen - 1, rule)
            cursor += timedelta(days=1)
            if (cursor - start).days > 400:
                break
        return False
    if freq == "MONTHLY":
        if target.day != start.day:
            return False
        months = (target.year - start.year) * 12 + target.month - start.month
        return months % interval == 0 and _within_count(months // interval, rule)
    if freq == "YEARLY":
        if (target.month, target.day) != (start.month, start.day):
            return False
        years = target.year - start.year
        return years % interval == 0 and _within_count(years // interval, rule)
    return False


def _until(value: str) -> date | None:
    found = re.match(r"(\d{8})", value)
    if not found:
        return None
    raw = found.group(1)
    try:
        return date(int(raw[0:4]), int(raw[4:6]), int(raw[6:8]))
    except ValueError:
        return None


def _within_count(index: int, rule: dict) -> bool:
    raw = rule.get("COUNT")
    if raw is None:
        return True
    try:
        return index < int(raw)
    except ValueError:
        return True


def _clock(local: datetime) -> str:
    hour = local.hour
    suffix = "a" if hour < 12 else "p"
    shown = hour % 12 or 12
    if local.minute:
        return f"{shown}:{local.minute:02d}{suffix}"
    return f"{shown}{suffix}"
