"""Yahoo Finance quotes, charts, and symbol search."""

from __future__ import annotations

import json
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from brieflib.net import UA, UpstreamError, cache_get, cache_set, cookie_header, fetch
from brieflib.symbols import alias_map

_crumb_lock = threading.Lock()
_crumb = {"value": "", "at": 0.0}

RANGES = {
    "1D": ("1d", "5m", True),
    "5D": ("5d", "15m", True),
    "1M": ("1mo", "1d", False),
    "3M": ("3mo", "1d", False),
    "1Y": ("1y", "1d", False),
    "5Y": ("5y", "1wk", False),
}

# Stable order so the eye learns the tape.
OVERNIGHT = [
    ("ES=F", "S&P fut", "usd"),
    ("NQ=F", "Nasdaq fut", "usd"),
    ("YM=F", "Dow fut", "usd"),
    ("RTY=F", "Russell", "usd"),
    ("GC=F", "Gold", "usd"),
    ("CL=F", "Oil", "usd"),
    ("BTC-USD", "Bitcoin", "usd"),
    ("^TNX", "10-year", "yield"),
    ("^VIX", "VIX", "plain"),
    ("EURUSD=X", "EUR/USD", "fx"),
    ("JPY=X", "USD/JPY", "fx"),
]

_INC = re.compile(
    r",?\s+(Inc\.?|Incorporated|Corporation|Corp\.?|Ltd\.?|Limited|PLC|N\.V\.|S\.A\.|AG|Co\.)$",
    re.I,
)


def _prime_cookies() -> None:
    try:
        fetch("https://fc.yahoo.com", timeout=8)
    except UpstreamError:
        pass


def crumb(force: bool = False) -> str:
    with _crumb_lock:
        if not force and _crumb["value"] and time.time() - _crumb["at"] < 1800:
            return _crumb["value"]
        _prime_cookies()
        code, body = fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", timeout=8)
        value = body.decode("utf-8", "replace").strip()
        if code != 200 or not value or "<" in value:
            raise UpstreamError("The quote feed didn't answer.")
        _crumb["value"] = value
        _crumb["at"] = time.time()
        return value


def _yahoo_json(url: str, retry: bool = True) -> dict:
    token = urllib.parse.quote(crumb())
    sep = "&" if "?" in url else "?"
    code, body = fetch(f"{url}{sep}crumb={token}")
    if code == 401 and retry:
        crumb(force=True)
        return _yahoo_json(url, retry=False)
    if code != 200:
        raise UpstreamError("The quote feed didn't answer.")
    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise UpstreamError("The quote feed returned junk.") from exc


def _short_name(name: str) -> str:
    cleaned = _INC.sub("", name or "").strip()
    return cleaned or name


def _parse_chart(result: dict, range_key: str) -> dict | None:
    meta = result.get("meta") or {}
    timestamps = result.get("timestamp") or []
    quotes = ((result.get("indicators") or {}).get("quote") or [{}])[0]
    closes = quotes.get("close") or []
    points = []
    for stamp, close in zip(timestamps, closes):
        if stamp is None or close is None:
            continue
        points.append({"t": int(stamp), "v": float(close)})
    if not points:
        return None
    price = float(points[-1]["v"])
    previous = meta.get("previousClose")
    if previous is None:
        previous = meta.get("chartPreviousClose")
    base = float(previous) if range_key == "1D" and previous else float(points[0]["v"])
    change = price - base
    return {
        "symbol": meta.get("symbol") or "",
        "name": _short_name(meta.get("shortName") or meta.get("longName") or meta.get("symbol") or ""),
        "currency": meta.get("currency") or "USD",
        "price": price,
        "previousClose": float(previous) if previous else None,
        "base": base,
        "change": change,
        "changePercent": (change / base * 100) if base else 0.0,
        "marketTime": meta.get("regularMarketTime") or points[-1]["t"],
        "range": range_key,
        "points": points,
    }


def _chart_url(symbol: str, range_key: str) -> str:
    y_range, interval, prepost = RANGES[range_key]
    encoded = urllib.parse.quote(symbol, safe="")
    pre = "true" if prepost else "false"
    return (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{encoded}?range={y_range}&interval={interval}&includePrePost={pre}"
    )


def _chart_raw(symbol: str, range_key: str, required: bool = False) -> dict | None:
    range_key = range_key if range_key in RANGES else "1D"
    cache_key = f"chart:{symbol}:{range_key}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached
    try:
        data = _yahoo_json(_chart_url(symbol, range_key))
    except UpstreamError:
        if required:
            raise
        return None
    result = (data.get("chart") or {}).get("result") or []
    parsed = _parse_chart(result[0], range_key) if result else None
    if parsed:
        cache_set(cache_key, parsed, 20)
    return parsed


def get_chart(symbol: str, range_key: str = "1D") -> dict:
    symbol = (symbol or "").strip().upper()
    if not re.fullmatch(r"[A-Z0-9^=.\-]{1,16}", symbol):
        raise UpstreamError("That symbol isn't usable.")
    chart = _chart_raw(symbol, range_key if range_key in RANGES else "1D", required=True)
    if not chart:
        raise UpstreamError(f"No prints for {symbol}.")
    return chart


def _read_chart(symbol: str, token: str, cookie: str) -> dict | None:
    url = _chart_url(symbol, "1D") + "&crumb=" + urllib.parse.quote(token)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept": "application/json", "Cookie": cookie},
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            body = res.read()
    except urllib.error.HTTPError:
        return None
    except (urllib.error.URLError, TimeoutError, OSError):
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None
    result = (data.get("chart") or {}).get("result") or []
    return _parse_chart(result[0], "1D") if result else None


def _one_move(spec: tuple[str, str, str], token: str, cookie: str) -> dict | None:
    symbol, label, kind = spec
    chart = _read_chart(symbol, token, cookie)
    if not chart or not chart.get("previousClose"):
        return None
    prev = float(chart["previousClose"])
    price = float(chart["price"])
    if not prev:
        return None
    return {
        "symbol": symbol,
        "label": label,
        "kind": kind,
        "price": price,
        "previousClose": prev,
        "change": price - prev,
        "changePercent": (price - prev) / prev * 100,
    }


def get_overnight() -> dict:
    cached = cache_get("overnight")
    if cached is not None:
        return cached
    token = crumb()
    cookie = cookie_header()
    with ThreadPoolExecutor(max_workers=6) as pool:
        rows = list(pool.map(lambda spec: _one_move(spec, token, cookie), OVERNIGHT))
    moves = [row for row in rows if row]
    if len(moves) < 4:
        # Parallel cookies can be rejected; fall back to the shared client.
        moves = []
        for spec in OVERNIGHT:
            chart = _chart_raw(spec[0], "1D")
            if not chart or not chart.get("previousClose"):
                continue
            prev = float(chart["previousClose"])
            price = float(chart["price"])
            if not prev:
                continue
            moves.append({
                "symbol": spec[0],
                "label": spec[1],
                "kind": spec[2],
                "price": price,
                "previousClose": prev,
                "change": price - prev,
                "changePercent": (price - prev) / prev * 100,
            })
    if not moves:
        raise UpstreamError("Market moves didn't load.")
    payload = {"moves": moves}
    cache_set("overnight", payload, 20)
    return payload


def resolve_symbol(query: str) -> dict | None:
    raw = (query or "").strip()
    if not raw:
        return None
    cache_key = "resolve:" + raw.lower()
    cached = cache_get(cache_key)
    if cached is not None:
        return None if cached == "__none__" else cached

    mapped = alias_map().get(raw.lower())
    if mapped:
        raw = mapped
    up = raw.upper().replace(" ", "")
    candidates = []
    if re.fullmatch(r"[A-Z0-9^=.\-]{1,16}", up):
        candidates.append(up)
        if "." in up:
            candidates.append(up.replace(".", "-"))
    seen: set[str] = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        chart = _chart_raw(candidate, "1D")
        if chart and chart.get("symbol"):
            hit = {"symbol": chart["symbol"], "name": chart["name"]}
            cache_set(cache_key, hit, 3600)
            return hit

    hit = _search(raw)
    cache_set(cache_key, hit or "__none__", 3600 if hit else 120)
    return hit


def _search(query: str) -> dict | None:
    try:
        crumb()
    except UpstreamError:
        return None
    url = (
        "https://query2.finance.yahoo.com/v1/finance/search?quotesCount=8&newsCount=0&q="
        + urllib.parse.quote(query)
    )
    try:
        code, body = fetch(url)
    except UpstreamError:
        return None
    if code != 200:
        return None
    try:
        quotes = json.loads(body).get("quotes") or []
    except json.JSONDecodeError:
        return None
    picked = _pick_quote(quotes, query)
    if not picked or not picked.get("symbol"):
        return None
    name = picked.get("shortname") or picked.get("shortName") or picked.get("longname") or picked["symbol"]
    return {"symbol": picked["symbol"], "name": _short_name(str(name))}


def _pick_quote(quotes: list, query: str) -> dict | None:
    wanted = query.upper().replace(".", "-").replace(" ", "")
    preferred = {"EQUITY", "ETF", "INDEX", "CRYPTOCURRENCY", "CURRENCY", "FUTURE"}
    pool = [quote for quote in quotes if quote.get("quoteType") in preferred] or list(quotes)
    for quote in pool:
        symbol = (quote.get("symbol") or "").upper().replace(".", "-")
        if symbol == wanted:
            return quote
    for quote in pool:
        if quote.get("quoteType") == "EQUITY":
            return quote
    return pool[0] if pool else None
