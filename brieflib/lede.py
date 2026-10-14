"""Two calm sentences from the tiles already on the desk."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request

from brieflib.net import cache_get, cache_set

_MAX = 160


def lede_for(facts: dict) -> str:
    base = compose_lede(facts)
    if not base or not os.environ.get("XAI_API_KEY", "").strip():
        return base
    key = "lede:" + base
    cached = cache_get(key)
    if isinstance(cached, str):
        return cached
    try:
        text = _phrase(base)
    except Exception:
        cache_set(key, base, 120)
        return base
    if not _acceptable(text, base):
        cache_set(key, base, 120)
        return base
    cache_set(key, text, 900)
    return text


def compose_lede(facts: dict) -> str:
    if not isinstance(facts, dict):
        return ""
    primary = []
    weather = facts.get("weather") if isinstance(facts.get("weather"), dict) else None
    if weather and isinstance(weather.get("temp"), (int, float)) and not isinstance(weather.get("temp"), bool):
        unit = "C" if weather.get("unit") == "c" else "F"
        label = _clip(weather.get("label") or "weather", 40).lower()
        line = f"{round(weather['temp'])}°{unit} and {label}"
        place = _clip(weather.get("place") or "", 60)
        if place:
            line += f" in {place}"
        rain = _clip(weather.get("rain") or "", 40)
        if rain:
            line += f", with {rain}"
        primary.append(line)
    move = facts.get("move") if isinstance(facts.get("move"), dict) else None
    if move:
        label = _clip(move.get("label") or "", 40)
        text = _clip(move.get("text") or "", 40)
        if label and text:
            primary.append(f"{label} is {text}")
    secondary = []
    headline = _clip(facts.get("headline") or "", 140)
    if headline:
        secondary.append(f"Top story: {headline}")
    debt = facts.get("debt") if isinstance(facts.get("debt"), dict) else None
    if debt:
        total = _clip(debt.get("total") or "", 20)
        if total:
            line = f"The debt is {total}"
            change = _clip(debt.get("change") or "", 30)
            if change and change != "unchanged":
                line += f", {change} from the prior print"
            elif change == "unchanged":
                line += ", unchanged on the latest print"
            secondary.append(line)
    sentences = [part for part in (_fuse(primary), _fuse(secondary)) if part]
    return " ".join(sentences)


def _fuse(parts: list[str]) -> str:
    parts = [part for part in parts if part]
    if not parts:
        return ""
    if len(parts) == 1:
        return _sentence(parts[0])
    head = parts[0]
    tail = parts[1]
    second = tail[1:2]
    if tail[:1].isupper() and (not second.isalpha() or second.isupper()):
        joined = f"{head}, and {tail}"
    else:
        joined = f"{head}, and {tail[:1].lower()}{tail[1:]}"
    return _sentence(joined)


def _sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip(" ,")
    if not text:
        return ""
    if text[-1] not in ".!?":
        text += "."
    return text


def _clip(value, limit: int = _MAX) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    text = re.sub(r"[\x00-\x1f]", "", text)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def _acceptable(text: str, draft: str) -> bool:
    cleaned = re.sub(r"\s+", " ", text or "").strip()
    if not cleaned or len(cleaned) > 500 or "```" in cleaned:
        return False
    numbers = set(re.findall(r"\d+(?:\.\d+)?", draft))
    if numbers and not numbers & set(re.findall(r"\d+(?:\.\d+)?", cleaned)):
        return False
    return True


def _phrase(draft: str) -> str:
    key = os.environ.get("XAI_API_KEY", "").strip()
    payload = {
        "model": "grok-4.7",
        "messages": [
            {
                "role": "system",
                "content": (
                    "Rewrite this morning brief as at most two calm sentences. "
                    "Keep every number and name. Do not add facts. No emoji. "
                    "If the draft is already right, return it unchanged."
                ),
            },
            {"role": "user", "content": draft},
        ],
    }
    req = urllib.request.Request(
        "https://api.x.ai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            body = json.loads(res.read().decode("utf-8"))
        return body["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, TimeoutError, KeyError, IndexError, TypeError, json.JSONDecodeError, OSError):
        return ""
