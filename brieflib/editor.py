"""Turn a plain request into widget edits. Grok when a key is set, a phrase book otherwise."""

from __future__ import annotations

import json
import os
import re
import secrets
import urllib.error
import urllib.request

from brieflib.market import resolve_symbol
from brieflib.net import UpstreamError
from brieflib.symbols import ALIASES

TYPES = (
    "overnight",
    "weather",
    "headlines",
    "stock-chart",
    "stock-news",
    "btc-chart",
    "btc-news",
    "change",
    "joke",
    "debt",
    "today",
)
TOPICS = ("world", "business", "tech")
RANGES = ("1D", "5D", "1M", "3M", "1Y", "5Y")
WINDOWS = ("today", "week")
HELP = "Name a ticker, bitcoin, the weather, headlines, the national debt, an agenda, or a joke."
MAX_WIDGETS = 24

_SORTED_ALIASES = sorted(ALIASES, key=lambda item: len(item[0]), reverse=True)
_AND_ALIASES = [item for item in _SORTED_ALIASES if " and " in item[0]]

STOP = set(
    """
    a an the and or for to of in on my our your this that with without
    add show include remove drop hide delete update change switch make
    just only news headline headlines chart charts live stock stocks share shares
    today tonight morning week weekly daily overnight market markets move moves
    world business tech technology bitcoin btc crypto weather forecast temperature
    joke jokes dad debt national federal treasury deficit trillion trillions dollar dollars
    agenda calendar schedule todo to-do
    area here local city top major brief widget widgets please
    month months year years yr yrs three five one range past me it its those these too also plus onto into from
    about by up down view want give get pin desk board set reset start over
    versus vs prior settle largest current price prices quote quotes ticker
    company something anything everything hello hey hi thanks thank you
    kind some any all every new fresh another both same dow nasdaq russell
    spx gspc ndx dji futures premarket pre gold oil crude silver
    """.split()
)

CAPS_IGNORE = {
    "TODAY", "WEEK", "NEWS", "CHART", "CHARTS", "THE", "AND", "FOR", "ADD", "USD",
    "DAD", "JOKE", "JOKES", "WEATHER", "WORLD", "TECH", "BUSINESS", "LIVE", "ONLY",
    "JUST", "MY", "AREA", "NEW", "US", "UK", "EU", "NY", "TV", "OK", "AM", "PM",
    "EST", "EDT", "CST", "CDT", "PST", "PDT", "ET", "CT", "PT", "ALL", "TOP",
    "DAY", "DAYS", "MONTH", "MONTHS", "YEAR", "YEARS", "FIVE", "THREE", "DEBT", "FAQ", "YTD", "ATH", "CEO", "IPO", "GDP",
    "CPI", "FED", "IRS", "GPS", "NOW", "LOW", "BE", "IT", "SO", "OR", "AN",
    "OF", "TO", "IN", "ON", "AT", "BY", "UP", "DOW", "AI", "AGENDA", "ICS",
}

INDEX_CAPS = {"DJI": "^DJI", "SPX": "^GSPC", "GSPC": "^GSPC", "NDX": "^NDX", "IXIC": "^IXIC", "RUT": "^RUT"}
INDEX_PATTERNS = [
    (re.compile(r"\bs&p 500\b|\bs&p\b|\bspx\b", re.I), "^GSPC"),
    (re.compile(r"\bnasdaq\b|\bndx\b", re.I), "^IXIC"),
    (re.compile(r"\bdow jones\b|\bthe dow\b|\bdow\b", re.I), "^DJI"),
    (re.compile(r"\brussell(?: 2000)?\b", re.I), "^RUT"),
]
VERB = re.compile(
    r"^(?:please\s+)?(remove|drop|hide|delete|clear|add|show|include|update|change|switch|make|give me|i want)\s+(.*)$",
    re.I,
)
PLACE = re.compile(r"\b(?:in|for|at|to)\s+([A-Za-z][A-Za-z .,'-]{1,48})")
SMALL_WORDS = {"of", "the", "and", "de", "da"}

SYSTEM = """You edit Brief, a one-screen morning dashboard. The user asks to add, remove, or change widgets. Return only the structured edit.

Widget types:
- overnight: futures, commodities, bitcoin, rates, VIX, and FX versus the prior settle. Singleton.
- weather: place is null to leave the city as it is, "here" for the user's area, or a city name such as "Kyoto". span is day (the next hours), week (seven days), or null to leave it. Default day. Singleton.
- headlines: topic is world, business, or tech. One per topic.
- stock-chart: live chart. symbol is a Yahoo ticker. range is 1D, 5D, 1M, 3M, 1Y, or 5Y.
- stock-news: headlines for that ticker. window is today or week.
- btc-chart: bitcoin chart. range is 1D, 5D, 1M, 3M, 1Y, or 5Y. Use this for bitcoin, never a stock ticker.
- btc-news: bitcoin headlines. window is today or week.
- joke: one dad joke. Singleton.
- debt: U.S. total public debt outstanding, shown in trillions. Singleton. Use this for the national debt, the federal debt, or the debt clock.
- today: a short agenda for the day. Singleton. Use this for an agenda, a calendar, a schedule, or a to-do. Lines are edited on the tile.

Rules:
- Map companies to tickers: Tesla TSLA, Apple AAPL, Google or Alphabet GOOGL, Microsoft MSFT, Amazon AMZN, Nvidia NVDA, Meta META, Netflix NFLX, and other well-known listings. Never put a company name in symbol.
- A bare company or ticker adds both stock-chart at 1D and stock-news for today, unless they asked only for a chart or only for news.
- "this week" on news means window week. "this week" on a chart means range 5D. "this week", "weekly", or "7 day" on weather means span week. "today", "daily", or "hourly" on weather means span day. "month" means range 1M. "3 months" means 3M. "year" or "1 year" means 1Y. "5 years" means 5Y. Defaults are 1D, today, and day.
- "here", "my area", and "local" mean weather place null.
- reset true only to restore the original morning set. clear true only to empty the desk.
- To swap tickers, remove the old widget and add the new one. Do not change a symbol via update.
- On remove and update, set symbol or topic when they identify one widget. Leave them null to match every widget of that type.
- Unused fields are null.
- Do not add a widget that is already on the brief unless the user wants another ticker.
- reply is one calm sentence, no emoji.
- If the request is not about the brief, change nothing and say what you can add.
"""


class GrokError(Exception):
    pass


def edit(message: str, widgets: list, history: list | None = None) -> dict:
    incoming = []
    for raw in (widgets or [])[:40]:
        cleaned = normalize_stored(raw)
        if cleaned:
            incoming.append(cleaned)
    grok_failed = False
    plan = None
    source = "local"
    if os.environ.get("XAI_API_KEY", "").strip():
        try:
            plan = grok_plan(message, incoming, history or [])
            source = "grok"
        except GrokError as exc:
            print("grok failed:", ascii(str(exc))[:300])
            grok_failed = True
    if plan is None:
        plan = local_parse(message, incoming)
        source = "local"
    result = apply_plan(incoming, plan)
    if source == "local" and grok_failed and not result["changed"] and not result["failures"]:
        result["reply"] = 'Grok didn\'t answer. Try "NVDA this week" or "weather in Kyoto".'
    result["source"] = source
    return result


def grok_plan(message: str, widgets: list, history: list) -> dict:
    key = os.environ.get("XAI_API_KEY", "").strip()
    if not key:
        raise GrokError("missing key")
    messages = [{"role": "system", "content": SYSTEM}]
    for turn in history[-6:]:
        if not isinstance(turn, dict):
            continue
        role = turn.get("role")
        content = turn.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()[:800]})
    messages.append({
        "role": "user",
        "content": f"Current brief:\n{describe(widgets)}\n\nRequest: {message.strip()[:500]}",
    })
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "reply": {"type": "string"},
            "reset": {"type": "boolean"},
            "clear": {"type": "boolean"},
            "add": {"type": "array", "items": _widget_schema()},
            "remove": {"type": "array", "items": _widget_schema()},
            "update": {"type": "array", "items": _widget_schema()},
        },
        "required": ["reply", "reset", "clear", "add", "remove", "update"],
    }
    payload = {
        "model": "grok-4.7",
        "messages": messages,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "brief_edit", "strict": True, "schema": schema},
        },
    }
    req = urllib.request.Request(
        "https://api.x.ai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as res:
            body = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:400]
        raise GrokError(detail or f"HTTP {exc.code}") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        raise GrokError(str(exc)) from exc
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise GrokError("empty edit") from exc
    return coerce_plan(content)


def coerce_plan(content: str) -> dict:
    text = (content or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.S).strip()
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GrokError("edit was not json") from exc
    if not isinstance(raw, dict):
        raise GrokError("edit was not an object")
    def rows(key: str) -> list:
        value = raw.get(key) or []
        if not isinstance(value, list):
            return []
        return [item for item in value if isinstance(item, dict)]
    reply = raw.get("reply") if isinstance(raw.get("reply"), str) else ""
    return {
        "reply": reply.strip()[:280],
        "reset": bool(raw.get("reset")),
        "clear": bool(raw.get("clear")),
        "add": rows("add"),
        "remove": rows("remove"),
        "update": rows("update"),
    }


def local_parse(message: str, widgets: list | None = None) -> dict:
    widgets = widgets or []
    text = (message or "").strip()
    lower = text.lower()
    plan = {"reply": "", "reset": False, "clear": False, "add": [], "remove": [], "update": []}
    if not text:
        plan["reply"] = HELP
        return plan
    if re.fullmatch(r"(hi|hey|hello|yo|good morning|thanks|thank you)[.!]?", lower):
        plan["reply"] = "Morning. Name a ticker, bitcoin, the weather, headlines, the national debt, an agenda, or a joke."
        return plan
    if re.search(r"\banother (dad )?joke\b", lower):
        if any(widget.get("type") == "joke" for widget in widgets):
            plan["reply"] = "Hit Another on the joke for a fresh one."
            return plan
    if re.search(r"\b(clear|empty|wipe) (the )?(board|brief|desk)\b", lower) or re.search(
        r"\bremove (everything|all of it|every widget)\b", lower
    ):
        plan["clear"] = True
        plan["reply"] = "Cleared the desk."
        return plan
    if re.search(r"\b(reset|start over)\b", lower):
        plan["reset"] = True

    prepared = text
    for phrase, symbol in _AND_ALIASES:
        prepared = re.sub(rf"\b{re.escape(phrase)}\b", symbol, prepared, flags=re.I)
    parts = [part.strip(" .!?") for part in re.split(r"\s*(?:,|;|\band\b)\s*", prepared, flags=re.I)]
    parts = [part for part in parts if part]
    verb = "add"
    fallback = _message_mode(prepared)
    for part in parts:
        match = VERB.match(part)
        clause = part
        if match:
            word = match.group(1).lower()
            verb = "remove" if word in {"remove", "drop", "hide", "delete", "clear"} else (
                "update" if word in {"update", "change", "switch", "make"} else "add"
            )
            clause = match.group(2).strip()
        if not clause:
            continue
        if verb == "update":
            swapped = _ticker_swap(clause, fallback)
            if swapped:
                plan["remove"].extend(swapped[0])
                plan["add"].extend(swapped[1])
                continue
        specs = _clause_specs(clause, fallback)
        if verb == "remove":
            plan["remove"].extend(specs)
        elif verb == "update":
            plan["update"].extend(specs)
        else:
            plan["add"].extend(specs)
    _narrow(plan, widgets)
    if not plan["reply"]:
        plan["reply"] = _compose(plan)
    return plan


def apply_plan(widgets: list, plan: dict) -> dict:
    current = [dict(widget) for widget in widgets]
    if plan.get("reset"):
        current = default_widgets()
    elif plan.get("clear"):
        current = []
    failures: list[str] = []
    rejected = 0
    for raw in plan.get("remove") or []:
        selector = _selector(raw)
        if selector:
            current = [widget for widget in current if not _matches(widget, selector)]
    for raw in plan.get("update") or []:
        selector = _selector(raw)
        if not selector:
            continue
        for widget in current:
            if _matches(widget, selector):
                _merge_settings(widget, selector)
    focus: list[str] = []
    cursor = 1 if current and current[0]["type"] == "overnight" else 0
    for raw in plan.get("add") or []:
        cleaned = clean_widget(raw)
        if not cleaned:
            rejected += 1
            continue
        cleaned = _coerce_bitcoin(cleaned)
        if cleaned["type"] in {"stock-chart", "stock-news"}:
            try:
                hit = resolve_symbol(cleaned["symbol"])
            except UpstreamError:
                hit = None
            if not hit:
                failures.append(str(cleaned["symbol"]))
                continue
            cleaned["symbol"] = hit["symbol"]
            cleaned = _coerce_bitcoin(cleaned)
        slot = _slot(cleaned)
        existing = next((i for i, widget in enumerate(current) if _slot(widget) == slot), None)
        if existing is not None:
            before = json.dumps(current[existing], sort_keys=True)
            _merge_widget(current[existing], cleaned)
            if json.dumps(current[existing], sort_keys=True) != before:
                focus.append(current[existing]["id"])
            continue
        if len(current) >= MAX_WIDGETS:
            failures.append("a full desk")
            break
        cleaned["id"] = secrets.token_hex(4)
        current.insert(cursor, cleaned)
        focus.append(cleaned["id"])
        cursor += 1
    for widget in current:
        if widget.get("type") == "weather" and not widget.get("place"):
            widget.pop("place", None)
    changed = _fingerprint(widgets) != _fingerprint(current)
    reply = _reply_for(plan, changed, failures, rejected)
    return {"reply": reply, "widgets": current, "focus": focus, "changed": changed, "failures": failures}


def default_widgets() -> list[dict]:
    # Keep this set aligned with the first-visit board in static/app.js.
    specs = [
        {"type": "today"},
        {"type": "overnight"},
        {"type": "debt"},
        {"type": "weather"},
        {"type": "headlines", "topic": "world"},
        {"type": "headlines", "topic": "business"},
        {"type": "headlines", "topic": "tech"},
        {"type": "btc-chart", "range": "1D"},
        {"type": "btc-news", "window": "today"},
        {"type": "joke"},
    ]
    widgets = []
    for spec in specs:
        widget = clean_widget(spec)
        if widget:
            widget["id"] = secrets.token_hex(4)
            widgets.append(widget)
    return widgets


def normalize_stored(raw: dict) -> dict | None:
    if not isinstance(raw, dict):
        return None
    cleaned = clean_widget(raw)
    if not cleaned:
        return None
    ident = raw.get("id")
    if not isinstance(ident, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,32}", ident):
        ident = secrets.token_hex(4)
    cleaned["id"] = ident
    return cleaned


def clean_widget(raw: dict) -> dict | None:
    if not isinstance(raw, dict):
        return None
    kind = raw.get("type")
    if kind not in TYPES:
        return None
    widget: dict = {"type": kind}
    if kind == "headlines":
        topic = raw.get("topic")
        query = _text(raw.get("query"))[:80]
        if topic in TOPICS:
            widget["topic"] = topic
        elif query:
            widget["query"] = query
            widget["window"] = raw.get("window") if raw.get("window") in WINDOWS else "today"
        else:
            return None
    elif kind in {"stock-chart", "stock-news", "change"}:
        symbol = _text(raw.get("symbol")).upper().replace(" ", "")
        if not re.fullmatch(r"[A-Z0-9^=.\-]{1,16}", symbol or ""):
            return None
        widget["symbol"] = symbol
        if kind == "stock-chart":
            widget["range"] = raw.get("range") if raw.get("range") in RANGES else "1D"
        elif kind == "stock-news":
            widget["window"] = raw.get("window") if raw.get("window") in WINDOWS else "today"
    elif kind == "btc-chart":
        widget["range"] = raw.get("range") if raw.get("range") in RANGES else "1D"
    elif kind == "btc-news":
        widget["window"] = raw.get("window") if raw.get("window") in WINDOWS else "today"
    elif kind == "weather":
        raw_place = raw.get("place") if isinstance(raw.get("place"), str) else ""
        if raw.get("clear_place") or _is_local_place(raw_place):
            widget["place"] = None
        else:
            place = clean_place(raw_place)
            if place:
                widget["place"] = place
        if raw.get("span") in {"day", "week"}:
            widget["span"] = raw["span"]
    elif kind == "today":
        if isinstance(raw.get("items"), list):
            widget["items"] = _clean_agenda(raw["items"])
        day = raw.get("day")
        if isinstance(day, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
            widget["day"] = day
        feed = _clean_feed(raw.get("feed"))
        if feed:
            widget["feed"] = feed
    return widget


def _clean_agenda(items: list) -> list:
    cleaned = []
    for raw in items[:24]:
        if not isinstance(raw, dict):
            continue
        text = re.sub(r"[\x00-\x1f]", "", re.sub(r"\s+", " ", _text(raw.get("text")))).strip()[:120]
        if not text:
            continue
        ident = raw.get("id")
        if not isinstance(ident, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,32}", ident):
            ident = secrets.token_hex(4)
        cleaned.append({"id": ident, "text": text, "done": bool(raw.get("done"))})
    return cleaned


def _clean_feed(value) -> str | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if text.lower().startswith("webcal://"):
        text = "https://" + text[9:]
    if not text.lower().startswith("https://") or len(text) > 500 or " " in text:
        return None
    return text


def _is_local_place(value: str) -> bool:
    text = re.sub(r"\s+", " ", value or "").strip().lower()
    return text in {"my area", "here", "local", "current location", "my location", "near me"}


def clean_place(value: str | None) -> str | None:
    if not isinstance(value, str):
        return None
    text = re.sub(r"\s+", " ", value).strip()
    text = re.sub(r"[^A-Za-z0-9 .,'-]", "", text).strip(" ,.-")
    if not text or len(text) > 60:
        return None
    if _is_local_place(text):
        return None
    parts = []
    for index, word in enumerate(text.split(" ")):
        if index and word.lower() in SMALL_WORDS:
            parts.append(word.lower())
        elif word.isupper() and len(word) <= 3:
            parts.append(word)
        else:
            parts.append(word[:1].upper() + word[1:])
    return " ".join(parts)


def describe(widgets: list) -> str:
    if not widgets:
        return "(empty)"
    lines = []
    for widget in widgets:
        kind = widget.get("type")
        if kind == "headlines":
            if widget.get("query"):
                lines.append(f"- headlines {widget['query']}")
            else:
                lines.append(f"- headlines {widget.get('topic')}")
        elif kind == "today":
            count = len(widget.get("items") or [])
            lines.append(f"- today {count} items" if count else "- today")
        elif kind == "stock-chart":
            lines.append(f"- stock-chart {widget.get('symbol')} {widget.get('range', '1D')}")
        elif kind == "stock-news":
            lines.append(f"- stock-news {widget.get('symbol')} {widget.get('window', 'today')}")
        elif kind == "change":
            lines.append(f"- change {widget.get('symbol')}")
        elif kind == "btc-chart":
            lines.append(f"- btc-chart {widget.get('range', '1D')}")
        elif kind == "btc-news":
            lines.append(f"- btc-news {widget.get('window', 'today')}")
        elif kind == "weather":
            where = widget.get("place") or "my area"
            span = widget.get("span") if widget.get("span") in {"day", "week"} else "day"
            lines.append(f"- weather {where} {span}")
        else:
            lines.append(f"- {kind}")
    return "\n".join(lines)


def _widget_schema() -> dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "type": {"type": "string", "enum": list(TYPES)},
            "symbol": {"type": ["string", "null"]},
            "topic": {"anyOf": [{"type": "string", "enum": list(TOPICS)}, {"type": "null"}]},
            "range": {"anyOf": [{"type": "string", "enum": list(RANGES)}, {"type": "null"}]},
            "window": {"anyOf": [{"type": "string", "enum": list(WINDOWS)}, {"type": "null"}]},
            "place": {"type": ["string", "null"]},
            "span": {"anyOf": [{"type": "string", "enum": ["day", "week"]}, {"type": "null"}]},
        },
        "required": ["type", "symbol", "topic", "range", "window", "place", "span"],
    }


def _message_mode(text: str) -> str | None:
    has_chart = bool(re.search(r"\bcharts?\b", text, re.I))
    has_news = bool(re.search(r"\b(news|headlines?)\b", text, re.I))
    if has_chart and not has_news:
        return "chart"
    if has_news and not has_chart:
        return "news"
    return None


def _clause_mode(clause: str, fallback: str | None) -> str:
    has_chart = bool(re.search(r"\bcharts?\b", clause, re.I))
    has_news = bool(re.search(r"\b(news|headlines?)\b", clause, re.I))
    if has_chart and not has_news:
        return "chart"
    if has_news and not has_chart:
        return "news"
    return fallback or "both"


def _chart_span(clause: str, mode: str, window: str) -> str:
    if re.search(r"\b(5y|5yr|5yrs|5-years?|5 years?|five years?)\b", clause, re.I):
        return "5Y"
    if re.search(
        r"\b(1y|1yr|1yrs|1-years?|1 years?|one years?|a year|the year|past year|this year|12m|yearly|years?)\b",
        clause,
        re.I,
    ):
        return "1Y"
    if re.search(r"\b(3m|3mo|3-months?|3 months?|three months?|90d)\b", clause, re.I):
        return "3M"
    if re.search(r"\b(months?|1m|30d)\b", clause, re.I):
        return "1M"
    if re.search(r"\b(5d|5-days?|5 days?|five days?)\b", clause, re.I) or (mode == "chart" and window == "week"):
        return "5D"
    return "1D"


def _clause_specs(clause: str, fallback: str | None) -> list[dict]:
    mode = _clause_mode(clause, fallback)
    window = "week" if re.search(r"\b(week|7d|past week|this week)\b", clause, re.I) else "today"
    span = _chart_span(clause, mode, window)
    specs: list[dict] = []
    low = clause.lower()
    if re.search(r"\b(dad joke|jokes?)\b", low):
        specs.append({"type": "joke"})
    if re.search(r"\b(weather|forecast|temperature)\b", low):
        weather = {"type": "weather"}
        if re.search(r"\b(my area|my location|right here|near me|local|current location)\b", low):
            weather["clear_place"] = True
        else:
            place = _place_from(clause)
            if place:
                weather["place"] = place
        if re.search(r"\b(weekly|7-days?|7 days?|seven[- ]days?)\b", low) or window == "week":
            weather["span"] = "week"
        elif re.search(r"\b(today|daily|hourly)\b", low):
            weather["span"] = "day"
        specs.append(weather)
    if re.search(r"\bheadlines\b", low) and not re.search(r"\b(world|business|tech|technology|bitcoin|btc)\b", low):
        if not _extract_symbols(clause):
            specs.extend({"type": "headlines", "topic": topic} for topic in TOPICS)
    if re.search(r"\bworld\b", low):
        specs.append({"type": "headlines", "topic": "world"})
    if re.search(r"\bbusiness\b", low):
        specs.append({"type": "headlines", "topic": "business"})
    if re.search(r"\b(tech|technology)\b", low):
        specs.append({"type": "headlines", "topic": "tech"})
    if re.search(r"\bdebt\b", low):
        specs.append({"type": "debt"})
    if re.search(r"\b(agenda|calendar|schedule|to-do|todo|my day)\b", low):
        specs.append({"type": "today"})
    if re.search(r"\b(overnight|futures|pre-?market|market moves)\b", low) or (
        re.search(r"\bmarkets?\b", low) and not re.search(r"\b(headline|news|chart)\b", low)
    ):
        specs.append({"type": "overnight"})
    if re.search(r"\b(bitcoin|btc)\b", low) and not re.search(r"\bstock\b", low):
        _add_btc(specs, mode, span, window)
    indexes, rest = _pull_indexes(clause)
    if indexes:
        if mode == "chart":
            for symbol in indexes:
                specs.append({"type": "stock-chart", "symbol": symbol, "range": span})
        elif mode == "news":
            for symbol in indexes:
                specs.append({"type": "stock-news", "symbol": symbol, "window": window})
        elif re.search(r"\b(chart|news|headline)\b", clause, re.I):
            for symbol in indexes:
                _add_symbol(specs, symbol, mode, span, window)
        else:
            specs.append({"type": "overnight"})
        clause = rest
    if re.search(r"\ball (the )?(charts|graphs)\b", low):
        specs.append({"type": "stock-chart"})
        specs.append({"type": "btc-chart"})
    if re.search(r"\ball (the )?(headlines|news)\b", low):
        specs.append({"type": "headlines"})
        specs.append({"type": "stock-news"})
        specs.append({"type": "btc-news"})
    symbols = _extract_symbols(clause)
    for symbol in symbols:
        if symbol in {"BTC-USD", "BTC"}:
            _add_btc(specs, mode, span, window)
            continue
        _add_symbol(specs, symbol, mode, span, window)
    has_instrument = bool(symbols) or bool(indexes) or bool(re.search(r"\b(bitcoin|btc)\b", low))
    if re.search(r"\bcharts?\b", clause, re.I) and not has_instrument:
        if not any(spec.get("type") in {"stock-chart", "btc-chart"} for spec in specs):
            specs.append({"type": "stock-chart", "range": span})
    if not specs:
        words = [word for word in re.findall(r"[A-Za-z]{2,}", clause.lower()) if word not in STOP]
        if len(words) == 1 and words[0].upper() not in CAPS_IGNORE:
            _add_symbol(specs, words[0].upper(), mode, span, window)
    return _dedupe(specs)


def _add_btc(specs: list[dict], mode: str, span: str, window: str) -> None:
    if mode in {"chart", "both"}:
        specs.append({"type": "btc-chart", "range": span})
    if mode in {"news", "both"}:
        specs.append({"type": "btc-news", "window": window})


def _add_symbol(specs: list[dict], symbol: str, mode: str, span: str, window: str) -> None:
    if mode in {"chart", "both"}:
        specs.append({"type": "stock-chart", "symbol": symbol, "range": span})
    if mode in {"news", "both"} and "=" not in symbol:
        specs.append({"type": "stock-news", "symbol": symbol, "window": window})


def _pull_indexes(clause: str) -> tuple[list[str], str]:
    found = []
    rest = clause
    for pattern, symbol in INDEX_PATTERNS:
        if pattern.search(rest):
            found.append(symbol)
            rest = pattern.sub(" ", rest)
    return found, rest


def _extract_symbols(clause: str) -> list[str]:
    found = []
    working = clause
    for phrase, symbol in _SORTED_ALIASES:
        pattern = re.compile(rf"\b{re.escape(phrase)}\b", re.I)
        if pattern.search(working):
            found.append(symbol)
            working = pattern.sub(" ", working)
    for match in re.findall(r"\b[A-Z]{1,5}(?:[.\-][A-Z]{1,2})?\b", clause):
        if match in CAPS_IGNORE:
            continue
        found.append(INDEX_CAPS.get(match, match.replace(".", "-")))
    deduped = []
    for symbol in found:
        if symbol not in deduped:
            deduped.append(symbol)
    return deduped


def _place_from(clause: str) -> str | None:
    match = PLACE.search(clause)
    if not match:
        return None
    place = re.sub(
        r"\b(today|tonight|this week|week|weekly|daily|hourly|day|days|seven|forecast|please|now|widget|widgets|chart|news)\b",
        "",
        match.group(1),
        flags=re.I,
    )
    place = re.sub(r"\s+", " ", place).strip(" ,.-")
    if re.fullmatch(r"(the|a|an)", place, re.I):
        return None
    return clean_place(place)


def _ticker_swap(clause: str, fallback: str | None) -> tuple[list[dict], list[dict]] | None:
    match = re.match(r"(.+?)\s+(?:to|with)\s+(.+)$", clause, re.I)
    if not match or re.search(r"\bweather\b", clause, re.I):
        return None
    right = match.group(2).strip()
    if re.fullmatch(
        r"(1d|5d|1m|3m|1y|5y|today|this week|the week|a week|a month|the month|"
        r"3 months?|three months?|a year|the year|1 years?|one years?|5 years?|five years?|my area)",
        right,
        re.I,
    ):
        return None
    mode = _clause_mode(clause, fallback)
    return _clause_specs(match.group(1), mode), _clause_specs(right, mode)


def _narrow(plan: dict, widgets: list) -> None:
    """Point 'the chart' at the only chart on the desk when that's unambiguous."""
    charts = [widget for widget in widgets if widget.get("type") in {"stock-chart", "btc-chart"}]
    for key in ("remove", "update"):
        specs = plan[key]
        wipes_every_chart = any(spec.get("type") == "btc-chart" for spec in specs) and any(
            spec.get("type") == "stock-chart" and not spec.get("symbol") for spec in specs
        )
        if wipes_every_chart:
            continue
        narrowed = []
        for spec in plan[key]:
            if spec.get("type") == "stock-chart" and not spec.get("symbol"):
                if len(charts) == 1:
                    only = charts[0]
                    spec = dict(spec)
                    spec["type"] = only["type"]
                    if only["type"] == "stock-chart":
                        spec["symbol"] = only.get("symbol")
                    narrowed.append(spec)
                    continue
                if len(charts) > 1:
                    plan["reply"] = "Which chart — name the ticker, or say bitcoin."
                    continue
            narrowed.append(spec)
        plan[key] = narrowed


def _dedupe(specs: list[dict]) -> list[dict]:
    kept = []
    seen = set()
    for spec in specs:
        marker = (
            spec.get("type"),
            spec.get("symbol"),
            spec.get("topic"),
            spec.get("range"),
            spec.get("window"),
            spec.get("place"),
            spec.get("span"),
            spec.get("query"),
        )
        if marker in seen:
            continue
        seen.add(marker)
        kept.append(spec)
    return kept


def _selector(raw: dict) -> dict | None:
    if not isinstance(raw, dict) or raw.get("type") not in TYPES:
        return None
    selector = {"type": raw["type"]}
    symbol = _text(raw.get("symbol"))
    if symbol:
        selector["symbol"] = symbol
    if raw.get("topic") in TOPICS:
        selector["topic"] = raw["topic"]
    if raw.get("range") in RANGES:
        selector["range"] = raw["range"]
    if raw.get("window") in WINDOWS:
        selector["window"] = raw["window"]
    if raw.get("type") == "weather":
        raw_place = raw.get("place") if isinstance(raw.get("place"), str) else ""
        if raw.get("clear_place") or _is_local_place(raw_place):
            selector["place"] = None
        else:
            place = clean_place(raw_place)
            if place:
                selector["place"] = place
        if raw.get("span") in {"day", "week"}:
            selector["span"] = raw["span"]
    return selector


def _matches(widget: dict, selector: dict) -> bool:
    if widget.get("type") != selector.get("type"):
        return False
    kind = widget["type"]
    if kind in {"stock-chart", "stock-news"} and selector.get("symbol"):
        return _loose(widget.get("symbol", "")) == _loose(selector["symbol"])
    if kind == "headlines" and selector.get("topic"):
        return widget.get("topic") == selector["topic"]
    return True


def _merge_settings(widget: dict, patch: dict) -> None:
    if patch.get("range") in RANGES and widget["type"] in {"stock-chart", "btc-chart"}:
        widget["range"] = patch["range"]
    if patch.get("window") in WINDOWS and widget["type"] in {"stock-news", "btc-news"}:
        widget["window"] = patch["window"]
    if widget["type"] == "weather" and "place" in patch:
        if patch.get("place"):
            widget["place"] = patch["place"]
        else:
            widget.pop("place", None)
    if widget["type"] == "weather" and patch.get("span") in {"day", "week"}:
        widget["span"] = patch["span"]


def _merge_widget(widget: dict, incoming: dict) -> None:
    for key, value in incoming.items():
        if key != "type":
            widget[key] = value
    if widget["type"] == "weather":
        if "place" in incoming and not incoming.get("place"):
            widget.pop("place", None)
        elif "place" not in incoming and "span" not in incoming:
            widget.pop("place", None)


def _coerce_bitcoin(widget: dict) -> dict:
    symbol = _loose(widget.get("symbol", ""))
    if symbol not in {"BTC-USD", "BTC", "XBT"}:
        return widget
    if widget["type"] == "stock-chart":
        return {"type": "btc-chart", "range": widget.get("range") or "1D"}
    if widget["type"] == "stock-news":
        return {"type": "btc-news", "window": widget.get("window") or "today"}
    return widget


def _loose(value: str) -> str:
    return str(value or "").strip().upper().replace(".", "-")


def _text(value) -> str:
    return value.strip() if isinstance(value, str) else ""


def _slot(widget: dict) -> tuple:
    kind = widget["type"]
    if kind in {"stock-chart", "stock-news", "change"}:
        return (kind, _loose(widget.get("symbol", "")))
    if kind == "headlines":
        if widget.get("query"):
            return (kind, "q:" + _text(widget["query"]).lower())
        return (kind, widget.get("topic"))
    return (kind,)


def _fingerprint(widgets: list) -> str:
    public = []
    for widget in widgets:
        public.append({
            "type": widget.get("type"),
            "symbol": widget.get("symbol"),
            "topic": widget.get("topic"),
            "range": widget.get("range"),
            "window": widget.get("window"),
            "place": widget.get("place"),
            "span": widget.get("span"),
            "query": widget.get("query"),
        })
    return json.dumps(public, sort_keys=True)


def _compose(plan: dict) -> str:
    if plan.get("reset") and not (plan.get("add") or plan.get("remove") or plan.get("update")):
        return "Back to the morning set."
    bits = []
    if plan.get("reset"):
        bits.append("Reset the brief")
    if plan.get("clear"):
        bits.append("Cleared the desk")
    if plan.get("add"):
        bits.append("Added " + _join(_labels(plan["add"])))
    if plan.get("remove"):
        bits.append("Removed " + _join(_labels(plan["remove"])))
    if plan.get("update"):
        bits.append("Updated " + _join(_labels(plan["update"])))
    if not bits:
        return HELP
    text = ". ".join(bits)
    return text[0].upper() + text[1:] + ("." if not text.endswith(".") else "")


def _labels(specs: list[dict]) -> list[str]:
    labels = []
    for spec in specs:
        kind = spec.get("type")
        if kind == "overnight":
            labels.append("overnight moves")
        elif kind == "weather":
            if spec.get("place"):
                label = f"weather in {spec['place']}"
            elif spec.get("clear_place"):
                label = "local weather"
            else:
                label = "the weather"
            if spec.get("span") == "week":
                label += " for the week"
            elif spec.get("span") == "day":
                label += " for today"
            labels.append(label)
        elif kind == "headlines":
            labels.append(f"{spec.get('topic') or 'the'} headlines")
        elif kind == "joke":
            labels.append("a dad joke")
        elif kind == "debt":
            labels.append("the national debt")
        elif kind == "today":
            labels.append("today's agenda")
        elif kind == "btc-chart":
            extra = f" ({spec['range']})" if spec.get("range") not in {None, "1D"} else ""
            labels.append(f"a bitcoin chart{extra}")
        elif kind == "btc-news":
            extra = " for the week" if spec.get("window") == "week" else ""
            labels.append(f"bitcoin news{extra}")
        elif kind == "stock-chart":
            extra = f" ({spec['range']})" if spec.get("range") not in {None, "1D"} else ""
            labels.append(f"{spec.get('symbol') or 'a'} chart{extra}")
        elif kind == "stock-news":
            extra = " for the week" if spec.get("window") == "week" else ""
            labels.append(f"{spec.get('symbol') or 'stock'} news{extra}")
    return labels


def _join(items: list[str]) -> str:
    items = [item for item in items if item]
    if not items:
        return "that"
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " and " + items[-1]


def _reply_for(plan: dict, changed: bool, failures: list[str], rejected: int) -> str:
    base = (plan.get("reply") or "").strip() or _compose(plan)
    if failures:
        tail = "Couldn't find " + _join(failures) + "."
        if changed:
            return base.rstrip(".") + ". " + tail
        return tail
    if not changed:
        if rejected and not plan.get("reset"):
            return "I couldn't place that. Try a ticker, bitcoin, weather, headlines, the national debt, an agenda, or a joke."
        removes = bool(plan.get("remove")) and not any(plan.get(key) for key in ("add", "update", "reset", "clear"))
        if removes:
            return "That's already off the brief."
        if any(plan.get(key) for key in ("add", "update", "reset", "clear", "remove")):
            return "That's already on the brief."
        return base or HELP
    return base
