"""Brief — a morning desk you edit by asking Grok.

Run: python server.py
Then open the URL it prints. Put XAI_API_KEY in a .env file for natural language.
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from brieflib.agenda import get_agenda  # noqa: E402
from brieflib.board import read_board, write_board  # noqa: E402
from brieflib.editor import edit  # noqa: E402
from brieflib.debt import get_debt  # noqa: E402
from brieflib.jokes import get_joke  # noqa: E402
from brieflib.lede import lede_for  # noqa: E402
from brieflib.market import RANGES, get_chart, get_overnight, resolve_symbol  # noqa: E402
from brieflib.net import UpstreamError  # noqa: E402
from brieflib.news import get_news  # noqa: E402
from brieflib.prints import get_prints  # noqa: E402
from brieflib.weather import get_weather  # noqa: E402

STATIC = ROOT / "static"
FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/styles.css": ("styles.css", "text/css; charset=utf-8"),
    "/app.js": ("app.js", "text/javascript; charset=utf-8"),
    "/pet.js": ("pet.js", "text/javascript; charset=utf-8"),
}

_hits: list[float] = []
_hit_lock = threading.Lock()


class AppError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def load_env() -> None:
    path = ROOT / ".env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def grok_on() -> bool:
    return bool(os.environ.get("XAI_API_KEY", "").strip())


def limited() -> bool:
    now = time.time()
    with _hit_lock:
        while _hits and now - _hits[0] > 60:
            _hits.pop(0)
        if len(_hits) >= 30:
            return True
        _hits.append(now)
        return False


def one(query: dict, name: str, default: str = "") -> str:
    values = query.get(name) or []
    return values[0] if values else default


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._api("GET", parsed)
            return
        self._static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._api("POST", parsed)
            return
        self.send_json({"error": "Not found."}, 404)

    def log_message(self, fmt: str, *args) -> None:
        if self.path.startswith("/api/"):
            super().log_message(fmt, *args)

    def _static(self, path: str) -> None:
        if path == "/favicon.ico":
            self.send_response(204)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        item = FILES.get(path)
        if not item:
            self.send_json({"error": "Not found."}, 404)
            return
        name, content_type = item
        data = (STATIC / name).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def _api(self, method: str, parsed) -> None:
        try:
            payload = self._route(method, parsed.path, parse_qs(parsed.query))
        except AppError as exc:
            self.send_json({"error": str(exc)}, exc.status)
            return
        except UpstreamError as exc:
            self.send_json({"error": str(exc)}, 502)
            return
        except Exception:
            traceback.print_exc()
            self.send_json({"error": "Something on the desk failed."}, 500)
            return
        self.send_json(payload)

    def _route(self, method: str, path: str, query: dict):
        if method == "GET" and path == "/api/health":
            return {"ok": True, "grok": grok_on()}
        if method == "GET" and path == "/api/overnight":
            return get_overnight()
        if method == "GET" and path == "/api/debt":
            return get_debt()
        if method == "GET" and path == "/api/chart":
            symbol = one(query, "symbol").strip().upper()
            if not symbol:
                raise AppError("Name a symbol.")
            span = one(query, "range", "1D").upper()
            if span not in RANGES:
                span = "1D"
            return get_chart(symbol, span)
        if method == "GET" and path == "/api/symbol":
            text = one(query, "q").strip()
            if not text or len(text) > 40:
                raise AppError("Name a ticker.")
            hit = resolve_symbol(text)
            if not hit:
                raise AppError(f"Couldn't find {text}.")
            return hit
        if method == "GET" and path == "/api/news":
            topic = one(query, "topic").strip().lower() or None
            symbol = one(query, "symbol").strip().upper() or None
            text = one(query, "q").strip()
            window = one(query, "window", "today").strip().lower()
            if topic not in {None, "world", "business", "tech", "bitcoin"}:
                raise AppError("Unknown headline section.")
            if text and len(text) > 80:
                raise AppError("Keep the search short.")
            return get_news(topic=topic, symbol=symbol, query=text or None, window=window)
        if method == "GET" and path == "/api/weather":
            place = one(query, "place").strip()
            unit = "c" if one(query, "unit").lower() == "c" else "f"
            if place:
                return get_weather(place=place, unit=unit)
            lat = one(query, "lat")
            lon = one(query, "lon")
            if not lat or not lon:
                raise AppError("Share a city or your location.")
            try:
                return get_weather(lat=float(lat), lon=float(lon), unit=unit)
            except ValueError as exc:
                raise AppError("That location is off the map.") from exc
        if method == "GET" and path == "/api/joke":
            return get_joke()
        if method == "GET" and path == "/api/prints":
            return get_prints(one(query, "day").strip(), one(query, "offset", "0"))
        if method == "GET" and path == "/api/agenda":
            return get_agenda(one(query, "url").strip(), one(query, "day").strip(), one(query, "offset", "0"))
        if method == "GET" and path == "/api/board":
            return {"widgets": read_board()}
        if method == "POST" and path == "/api/board":
            body = self._body()
            widgets = body.get("widgets") if isinstance(body.get("widgets"), list) else None
            if widgets is None:
                raise AppError("The desk wasn't readable.")
            return {"widgets": write_board(widgets)}
        if method == "POST" and path == "/api/lede":
            body = self._body()
            facts = body.get("facts") if isinstance(body.get("facts"), dict) else {}
            return {"text": lede_for(facts)}
        if method == "POST" and path == "/api/prompt":
            if limited():
                raise AppError("Slow down a little, then ask again.", 429)
            body = self._body()
            message = body.get("message") if isinstance(body.get("message"), str) else ""
            message = message.strip()
            if not message:
                raise AppError("Say what to add.")
            if len(message) > 500:
                raise AppError("Keep it to a sentence or two.")
            widgets = body.get("widgets") if isinstance(body.get("widgets"), list) else []
            history = body.get("history") if isinstance(body.get("history"), list) else []
            result = edit(message, widgets, history)
            return {
                "reply": result["reply"],
                "widgets": result["widgets"],
                "focus": result["focus"],
                "source": result["source"],
            }
        raise AppError("Not found.", 404)

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length > 100_000:
            raise AppError("That request is too large.", 413)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise AppError("That request wasn't readable.") from exc
        if not isinstance(data, dict):
            raise AppError("That request wasn't readable.")
        return data

    def send_json(self, payload, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(raw)


class Server(ThreadingHTTPServer):
    daemon_threads = True


def serve() -> None:
    load_env()
    start = int(os.environ.get("BRIEF_PORT") or 8787)
    httpd = None
    port = start
    for port in range(start, start + 10):
        try:
            httpd = Server(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if httpd is None:
        print("No open port for Brief.", file=sys.stderr)
        sys.exit(1)
    state = "Grok is on." if grok_on() else "Grok is off — add XAI_API_KEY to .env. Short phrases still work."
    print(f"Brief is at http://127.0.0.1:{port}")
    print(state)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        httpd.server_close()


if __name__ == "__main__":
    serve()
