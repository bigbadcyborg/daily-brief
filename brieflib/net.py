"""Shared HTTP fetch, cookie jar, and a small TTL cache."""

from __future__ import annotations

import json
import threading
import time
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

_jar = CookieJar()
_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_jar))
_net_lock = threading.Lock()
_cache_lock = threading.Lock()
_cache: dict[str, tuple[float, object]] = {}


class UpstreamError(Exception):
    """A data provider failed. The message is safe to show in the UI."""


def cache_get(key: str):
    with _cache_lock:
        item = _cache.get(key)
        if not item:
            return None
        expires, value = item
        if expires < time.time():
            _cache.pop(key, None)
            return None
        return value


def cache_set(key: str, value, ttl: float) -> None:
    with _cache_lock:
        _cache[key] = (time.time() + ttl, value)


def cookie_header() -> str:
    with _net_lock:
        return "; ".join(f"{cookie.name}={cookie.value}" for cookie in _jar)


def fetch(url: str, headers: dict | None = None, timeout: float = 12) -> tuple[int, bytes]:
    hdrs = {"User-Agent": UA, "Accept": "*/*", "Accept-Language": "en-US,en;q=0.9"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, headers=hdrs)
    try:
        with _net_lock:
            with _opener.open(req, timeout=timeout) as res:
                return res.status, res.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise UpstreamError("A data feed didn't answer.") from exc


def fetch_json(url: str, headers: dict | None = None, timeout: float = 12):
    code, body = fetch(url, headers=headers, timeout=timeout)
    if code != 200:
        raise UpstreamError("A data feed didn't answer.")
    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise UpstreamError("A data feed returned junk.") from exc
