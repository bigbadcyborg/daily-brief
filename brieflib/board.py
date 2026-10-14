"""The desk, saved next to the server so a new browser can pick it up."""

from __future__ import annotations

import json
from pathlib import Path

from brieflib.editor import normalize_stored

ROOT = Path(__file__).resolve().parent.parent
PATH = ROOT / ".brief-board.json"


def read_board() -> list | None:
    if not PATH.exists():
        return None
    try:
        data = json.loads(PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    widgets = data.get("widgets") if isinstance(data, dict) else None
    if not isinstance(widgets, list):
        return None
    return _clean(widgets)


def write_board(widgets: list) -> list:
    cleaned = _clean(widgets)
    payload = json.dumps({"widgets": cleaned}, ensure_ascii=False, indent=2)
    tmp = PATH.with_suffix(".json.tmp")
    tmp.write_text(payload + "\n", encoding="utf-8")
    tmp.replace(PATH)
    return cleaned


def _clean(widgets: list) -> list:
    cleaned = []
    for raw in widgets[:24]:
        if not isinstance(raw, dict):
            continue
        item = normalize_stored(raw)
        if item:
            cleaned.append(item)
    return cleaned
