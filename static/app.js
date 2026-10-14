import { bootPet } from "./pet.js";

const STORAGE = "brief.board.v1";
const TYPES = new Set([
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
]);
const CHART_RANGES = ["1D", "5D", "1M", "3M", "1Y", "5Y"];
const FRESH = {
  overnight: 30000,
  weather: 600000,
  headlines: 180000,
  "stock-chart": 30000,
  "stock-news": 180000,
  "btc-chart": 30000,
  "btc-news": 180000,
  change: 30000,
  debt: 600000,
};
const CHIPS = [
  ["World", "Add top world headlines"],
  ["Business", "Add business headlines"],
  ["Tech", "Add tech headlines"],
  ["Bitcoin", "Add a live bitcoin chart and today's bitcoin news"],
  ["Markets", "Add major overnight market moves"],
  ["Weather", "Add the weather for my area"],
  ["Today", "Add today's agenda"],
  ["Joke", "Add a daily dad joke"],
  ["Debt", "Add the US national debt"],
];
const TOPICS = { world: "World", business: "Business", tech: "Technology" };

const board = document.getElementById("board");
const form = document.getElementById("prompt-form");
const input = document.getElementById("prompt");
const askBtn = document.getElementById("ask");
const replyEl = document.getElementById("reply");
const chipsEl = document.getElementById("chips");
const grokEl = document.getElementById("grok-state");
const addToggle = document.getElementById("add-toggle");
const addMenu = document.getElementById("add-menu");
const addQuery = document.getElementById("add-query");
const addHint = document.getElementById("add-hint");
const addLabel = document.getElementById("add-label");

let widgets = [];
let history = [];
let unit = "f";
let coords = null;
let geoState = "unknown";
let grokOn = false;
const dataCache = new Map();
const flights = new Map();
const jokes = new Map();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function uid() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 12);
}

function defaults() {
  return [
    { id: uid(), type: "today" },
    { id: uid(), type: "overnight" },
    { id: uid(), type: "debt" },
    { id: uid(), type: "weather" },
    { id: uid(), type: "headlines", topic: "world" },
    { id: uid(), type: "headlines", topic: "business" },
    { id: uid(), type: "headlines", topic: "tech" },
    { id: uid(), type: "btc-chart", range: "1D" },
    { id: uid(), type: "btc-news", window: "today" },
    { id: uid(), type: "joke" },
  ];
}

function validWidget(widget) {
  if (!widget || typeof widget !== "object" || !TYPES.has(widget.type) || typeof widget.id !== "string") {
    return false;
  }
  if (widget.type === "headlines") {
    const query = typeof widget.query === "string" ? widget.query.trim() : "";
    if (!TOPICS[widget.topic] && !query) return false;
  }
  if ((widget.type === "stock-chart" || widget.type === "stock-news" || widget.type === "change") && typeof widget.symbol !== "string") {
    return false;
  }
  return true;
}

function ensureToday(list) {
  if (list.some((widget) => widget.type === "today")) return list;
  try {
    if (localStorage.getItem("brief.today.seeded") === "1") return list;
  } catch {
    /* add it */
  }
  const today = { id: uid(), type: "today", items: [], day: localDay() };
  const next = list.slice();
  next.unshift(today);
  return next;
}

function ensureDebt(list) {
  if (list.some((widget) => widget.type === "debt")) return list;
  try {
    if (localStorage.getItem("brief.debt.seeded") === "1") return list;
  } catch {
    /* add it */
  }
  const debt = { id: uid(), type: "debt" };
  const next = list.slice();
  const overnight = next.findIndex((widget) => widget.type === "overnight");
  next.splice(overnight >= 0 ? overnight + 1 : 0, 0, debt);
  return next;
}

function loadBoard() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (Array.isArray(parsed)) {
      const clean = parsed.filter(validWidget).slice(0, 24);
      if (clean.length || parsed.length === 0) return clean;
    }
  } catch {
    /* use the morning set */
  }
  return null;
}

let boardReady = false;
let boardTimer = 0;

function saveLocal() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(widgets));
  } catch {
    /* private mode */
  }
}

function save() {
  saveLocal();
  if (!boardReady) return;
  clearTimeout(boardTimer);
  boardTimer = setTimeout(() => {
    fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgets }),
    }).catch(() => {
      /* the browser copy still stands */
    });
  }, 300);
}

function localDay(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    /* not a link */
  }
  return "";
}

function tone(value) {
  if (value > 0.0005) return "up";
  if (value < -0.0005) return "down";
  return "flat";
}

function signed(value, digits) {
  const body = Math.abs(value).toFixed(digits);
  if (value > 0.0000001) return `+${body}`;
  if (value < -0.0000001) return `−${body}`;
  return body;
}

function priceDigits(value) {
  const abs = Math.abs(value);
  if (abs >= 10000) return 0;
  if (abs >= 1) return 2;
  return 4;
}

function formatNum(value, digits) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function ago(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

function clockTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function sessionInfo(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  if (parts.weekday === "Sat" || parts.weekday === "Sun") return { label: "Closed", kind: "closed" };
  const mins = Number(parts.hour) * 60 + Number(parts.minute);
  if (mins >= 240 && mins < 570) return { label: "Pre-market", kind: "pre" };
  if (mins >= 570 && mins < 960) return { label: "Open", kind: "open" };
  if (mins >= 960 && mins < 1200) return { label: "After-hours", kind: "after" };
  return { label: "Closed", kind: "closed" };
}

function renderMast() {
  const now = new Date();
  const session = sessionInfo(now);
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now);
  document.getElementById("mast").innerHTML = `
    <div>
      <h1 class="word"><span class="mark" aria-hidden="true"></span>Brief</h1>
      <p class="eyebrow">Morning desk</p>
    </div>
    <div class="dateline">
      <p class="date">${esc(date)}</p>
      <p class="clock">${esc(time)}</p>
    </div>
    <p class="session ${session.kind}">${esc(session.label)}</p>
  `;
}

function spanOf(widget) {
  if (widget.type === "overnight" || widget.type === "weather" || widget.type === "joke" || widget.type === "debt" || widget.type === "today") return 12;
  if (widget.type === "headlines") return widget.query ? 6 : 4;
  if (widget.type === "change") return 2;
  return 6;
}

function kickerText(widget) {
  if (widget.type === "overnight") return "Overnight";
  if (widget.type === "debt") return "US debt";
  if (widget.type === "today") return "Today";
  if (widget.type === "weather") return widget.place || "Weather";
  if (widget.type === "headlines") return widget.query || TOPICS[widget.topic] || "Headlines";
  if (widget.type === "joke") return "A joke";
  if (widget.type === "btc-chart" || widget.type === "btc-news") return "Bitcoin";
  if (widget.type === "change" && widget.symbol === "BTC-USD") return "BTC";
  return widget.symbol || "Quote";
}

function kickerHtml(widget) {
  const label = esc(kickerText(widget));
  if (widget.type === "stock-chart" || widget.type === "btc-chart" || widget.type === "change") {
    return `<i class="live" aria-hidden="true"></i>${label}`;
  }
  return label;
}

function tileTools(id, name, index) {
  const safe = esc(name);
  const ident = esc(id);
  const up = index === 0 ? " disabled" : "";
  const down = index === widgets.length - 1 ? " disabled" : "";
  return `
    <div class="tools">
      <button class="nudge" type="button" data-move="up" data-id="${ident}" aria-label="Move ${safe} up"${up}>↑</button>
      <button class="nudge" type="button" data-move="down" data-id="${ident}" aria-label="Move ${safe} down"${down}>↓</button>
      <button class="x" type="button" data-remove="${ident}" aria-label="Remove ${safe}">×</button>
    </div>
  `;
}

function render() {
  if (!widgets.length) {
    board.innerHTML = `<div class="empty"><strong>The desk is clear.</strong><p>Use Add, or ask for a ticker, bitcoin, the weather, headlines, the national debt, an agenda, or a joke.</p></div>`;
    scheduleLede();
    return;
  }
  board.innerHTML = widgets.map((widget, index) => {
    const name = widget.type === "change" ? changeLabel(widget.symbol) : kickerText(widget);
    const tools = tileTools(widget.id, name, index);
    if (widget.type === "change") {
      return `
        <section class="tile change-tile span-${spanOf(widget)}" data-id="${esc(widget.id)}" data-type="change">
          ${tools}
          <div class="body" id="body-${esc(widget.id)}"></div>
        </section>
      `;
    }
    return `
      <section class="tile span-${spanOf(widget)}" data-id="${esc(widget.id)}" data-type="${esc(widget.type)}">
        <div class="kicker">
          <span class="kicker-label">${kickerHtml(widget)}</span>
          ${tools}
        </div>
        <div class="body" id="body-${esc(widget.id)}"></div>
      </section>
    `;
  }).join("");
  widgets.forEach(loadTile);
  scheduleLede();
}

function moveWidget(id, direction) {
  const index = widgets.findIndex((widget) => widget.id === id);
  const next = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || next < 0 || next >= widgets.length) return;
  const [widget] = widgets.splice(index, 1);
  widgets.splice(next, 0, widget);
  save();
  render();
  const tile = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
  const stay = tile && (tile.querySelector(`[data-move="${direction}"]:not(:disabled)`) || tile.querySelector(".nudge:not(:disabled)"));
  if (stay) stay.focus();
  if (tile) tile.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
}

function bodyOf(id) {
  return document.getElementById(`body-${id}`);
}

function setLabel(id, text) {
  const el = document.querySelector(`[data-id="${CSS.escape(id)}"] .kicker-label`);
  if (el) el.textContent = text;
}

function skeleton(type) {
  if (type === "change") return `<div class="skel w70"></div><div class="skel w40"></div>`;
  if (type === "stock-chart" || type === "btc-chart" || type === "overnight") {
    return `<div class="skel w40"></div><div class="skel lg"></div>`;
  }
  return `<div class="skel"></div><div class="skel w70"></div><div class="skel"></div><div class="skel w70"></div>`;
}

function cacheKey(widget) {
  if (widget.type === "weather") {
    const where = widget.place || (coords ? `${coords.lat},${coords.lon}` : "pending");
    return `weather:${where}:${unit}`;
  }
  if (widget.type === "headlines") {
    if (widget.query) return `news:q:${widget.query.trim().toLowerCase()}:${widget.window || "today"}`;
    return `headlines:${widget.topic}`;
  }
  if (widget.type === "stock-chart" || widget.type === "change") {
    const symbol = widget.type === "change" && widget.symbol === "BTC-USD" ? "BTC-USD" : widget.symbol;
    return `chart:${symbol}:${widget.type === "change" ? "1D" : (widget.range || "1D")}`;
  }
  if (widget.type === "btc-chart") return `chart:BTC-USD:${widget.range || "1D"}`;
  if (widget.type === "stock-news") return `news:${widget.symbol}:${widget.window || "today"}`;
  if (widget.type === "btc-news") return `news:bitcoin:${widget.window || "today"}`;
  if (widget.type === "overnight") return "overnight";
  if (widget.type === "debt") return "debt";
  return widget.id;
}

function urlFor(widget) {
  if (widget.type === "overnight") return "/api/overnight";
  if (widget.type === "debt") return "/api/debt";
  if (widget.type === "weather") {
    const query = new URLSearchParams({ unit });
    if (widget.place) query.set("place", widget.place);
    else {
      query.set("lat", String(coords.lat));
      query.set("lon", String(coords.lon));
    }
    return `/api/weather?${query}`;
  }
  if (widget.type === "headlines") {
    if (widget.query) {
      const query = new URLSearchParams({ q: widget.query, window: widget.window || "today" });
      return `/api/news?${query}`;
    }
    return `/api/news?topic=${widget.topic}`;
  }
  if (widget.type === "stock-news") {
    return `/api/news?symbol=${encodeURIComponent(widget.symbol)}&window=${widget.window || "today"}`;
  }
  if (widget.type === "btc-news") return `/api/news?topic=bitcoin&window=${widget.window || "today"}`;
  if (widget.type === "stock-chart" || widget.type === "change") {
    const range = widget.type === "change" ? "1D" : (widget.range || "1D");
    return `/api/chart?symbol=${encodeURIComponent(widget.symbol)}&range=${range}`;
  }
  if (widget.type === "btc-chart") return `/api/chart?symbol=BTC-USD&range=${widget.range || "1D"}`;
  return "/api/joke";
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) throw new Error(data.error || "The brief server didn't answer.");
  return data;
}

function loadTile(widget) {
  if (!widgets.some((item) => item.id === widget.id)) return;
  if (widget.type === "joke") {
    loadJoke(widget, false);
    return;
  }
  if (widget.type === "today") {
    paintToday(widget);
    return;
  }
  if (widget.type === "weather" && !widget.place && !coords) {
    if (geoState === "denied") paintWeatherPrompt(widget);
    else {
      const body = bodyOf(widget.id);
      if (body && body.dataset.ready !== "1") body.innerHTML = skeleton("weather");
    }
    return;
  }
  const key = cacheKey(widget);
  const hit = dataCache.get(key);
  if (hit && Date.now() - hit.at < (FRESH[widget.type] || 60000)) {
    paint(widget, hit.data);
    return;
  }
  const body = bodyOf(widget.id);
  if (body && body.dataset.ready !== "1") body.innerHTML = skeleton(widget.type);
  const token = (flights.get(widget.id) || 0) + 1;
  flights.set(widget.id, token);
  getJson(urlFor(widget))
    .then((data) => {
      if (flights.get(widget.id) !== token) return;
      dataCache.set(key, { at: Date.now(), data });
      paint(widget, data);
    })
    .catch((error) => {
      if (flights.get(widget.id) !== token) return;
      const current = bodyOf(widget.id);
      if (current && current.dataset.ready === "1") return;
      paintError(widget, error.message || "That didn't load.");
    });
}

function loadJoke(widget, force) {
  if (!force && jokes.has(widget.id)) {
    paintJoke(widget, jokes.get(widget.id));
    return;
  }
  const body = bodyOf(widget.id);
  if (body && !jokes.has(widget.id)) body.innerHTML = skeleton("joke");
  const token = (flights.get(widget.id) || 0) + 1;
  flights.set(widget.id, token);
  getJson("/api/joke")
    .then((data) => {
      if (flights.get(widget.id) !== token) return;
      jokes.set(widget.id, data.joke);
      paintJoke(widget, data.joke);
    })
    .catch((error) => {
      if (flights.get(widget.id) !== token) return;
      paintError(widget, error.message || "The joke didn't land.");
    });
}

function paint(widget, data) {
  if (widget.type === "overnight") paintOvernight(widget, data);
  else if (widget.type === "debt") paintDebt(widget, data);
  else if (widget.type === "weather") paintWeather(widget, data);
  else if (widget.type === "headlines" || widget.type === "stock-news" || widget.type === "btc-news") {
    paintNews(widget, data);
  } else if (widget.type === "stock-chart" || widget.type === "btc-chart") paintChart(widget, data);
  else if (widget.type === "change") paintChange(widget, data);
  else if (widget.type === "today") paintToday(widget);
  scheduleLede();
}

function paintError(widget, message) {
  const body = bodyOf(widget.id);
  if (!body) return;
  body.dataset.ready = "0";
  body.innerHTML = `<p class="error">${esc(message)}</p><button type="button" class="text-btn" data-retry="${esc(widget.id)}">Retry</button>`;
}

function formatMove(move) {
  if (move.kind === "yield") {
    const bp = (move.price - move.previousClose) * 100;
    return {
      main: `${signed(bp, 1)} bp`,
      sub: `${move.price.toFixed(3)}%`,
      tone: tone(bp),
      announce: `${move.label} ${signed(bp, 1)} bp`,
      score: Math.abs(move.changePercent),
    };
  }
  const digits = move.kind === "fx" ? (move.price >= 20 ? 2 : 4) : priceDigits(move.price);
  return {
    main: `${signed(move.changePercent, 2)}%`,
    sub: formatNum(move.price, digits),
    tone: tone(move.changePercent),
    announce: `${move.label} ${signed(move.changePercent, 2)}%`,
    score: Math.abs(move.changePercent),
  };
}

function changeLabel(symbol) {
  const text = String(symbol || "").toUpperCase();
  if (text === "BTC-USD") return "BTC";
  if (text.endsWith("=X")) {
    const pair = text.slice(0, -2);
    if (pair.length === 6) return `${pair.slice(0, 3)}/${pair.slice(3)}`;
  }
  return text;
}

function quoteKind(symbol) {
  const text = String(symbol || "").toUpperCase();
  if (text === "^TNX" || text === "^IRX" || text === "^FVX" || text === "^TYX") return "yield";
  if (text.endsWith("=X")) return "fx";
  return "price";
}

function paintChange(widget, data) {
  const body = bodyOf(widget.id);
  if (!body) return;
  const symbol = data.symbol || widget.symbol;
  const label = changeLabel(symbol);
  const previous = data.previousClose == null ? data.base : data.previousClose;
  const view = formatMove({
    kind: quoteKind(symbol),
    label,
    price: data.price,
    previousClose: previous,
    changePercent: data.changePercent,
  });
  body.dataset.ready = "1";
  body.innerHTML = `
    <div class="move">
      <div class="move-label">${esc(label)}</div>
      <div class="pct ${view.tone}">${esc(view.main)}</div>
      <div class="move-px">${esc(view.sub)}</div>
    </div>
  `;
}

function exactMoney(value) {
  const negative = String(value).trim().startsWith("-");
  const raw = String(value).trim().replace(/^-/, "");
  const [whole, frac = "00"] = raw.split(".");
  const cents = `${frac}00`.slice(0, 2);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}.${cents}`;
}

function compactDebt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

function debtDate(iso, withYear) {
  const [year, month, day] = String(iso || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", withYear
    ? { month: "short", day: "numeric", year: "numeric" }
    : { month: "short", day: "numeric" });
}

function trillionsLabel(value) {
  const n = Number(value) / 1e12;
  return Number.isFinite(n) ? `$${n.toFixed(2)}T` : "";
}

function paintDebt(widget, data) {
  const body = bodyOf(widget.id);
  if (!body) return;
  const trillions = Number(data.total) / 1e12;
  const figure = Number.isFinite(trillions) ? trillions.toFixed(2) : "—";
  const stats = [
    data.prior && ["Prior print", data.prior],
    data.month && ["30 days", data.month],
    data.year && ["One year", data.year],
  ].filter(Boolean);
  body.dataset.ready = "1";
  body.innerHTML = `
    <div class="debt">
      <div>
        <div class="temp" aria-label="${esc(exactMoney(data.total))} outstanding">$${esc(figure)}<span class="debt-unit">T</span></div>
        <p class="cond">${esc(exactMoney(data.total))}</p>
        <p class="hl">Total public debt outstanding · ${esc(debtDate(data.asOf, true))}</p>
      </div>
      <div class="debt-stats">
        ${stats.map(([label, stat]) => {
          const n = Number(stat.delta);
          const tone = n > 0 ? "down" : n < 0 ? "up" : "flat";
          return `
            <div class="move">
              <div class="move-label">${esc(label)}</div>
              <div class="pct ${tone}">${esc(compactDebt(stat.delta))}</div>
              <div class="move-px">${esc(debtDate(stat.asOf, false))}</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
    <p class="hl debt-split">Held by the public ${esc(trillionsLabel(data.heldByPublic))} · Intragovernmental ${esc(trillionsLabel(data.intragovernmental))}</p>
  `;
}

function paintOvernight(widget, data) {
  const body = bodyOf(widget.id);
  if (!body) return;
  const moves = (data.moves || []).map((move) => ({ ...move, view: formatMove(move) }));
  const largest = moves.slice().sort((a, b) => b.view.score - a.view.score)[0];
  const lede = largest
    ? `Largest move <b class="${largest.view.tone}">${esc(largest.view.announce)}</b> · vs prior settle`
    : "Vs prior settle";
  body.dataset.ready = "1";
  body.innerHTML = `
    <p class="lede">${lede}</p>
    <div class="moves">
      ${moves.map((move) => `
        <div class="move">
          <div class="move-label">${esc(move.label)}</div>
          <div class="pct ${move.view.tone}">${esc(move.view.main)}</div>
          <div class="move-px">${esc(move.view.sub)}</div>
        </div>
      `).join("")}
    </div>
    <div class="prints" id="prints-${esc(widget.id)}"><p class="note">Checking the calendar…</p></div>
  `;
  loadPrints(widget);
}

function loadPrints(widget) {
  const key = `prints:${localDay()}:${new Date().getTimezoneOffset()}`;
  const hit = dataCache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) {
    paintPrints(widget, hit.data);
    return;
  }
  const query = new URLSearchParams({
    day: localDay(),
    offset: String(new Date().getTimezoneOffset()),
  });
  getJson(`/api/prints?${query}`)
    .then((data) => {
      dataCache.set(key, { at: Date.now(), data });
      paintPrints(widget, data);
    })
    .catch(() => paintPrints(widget, { items: [], error: "The calendar didn't load." }));
}

function paintPrints(widget, data) {
  const root = document.getElementById(`prints-${widget.id}`);
  if (!root) return;
  const items = data.items || [];
  if (!items.length) {
    root.innerHTML = `<p class="note">${esc(data.error || "No major U.S. prints today.")}</p>`;
    return;
  }
  root.innerHTML = `
    <div class="move-label">Prints</div>
    <ul>
      ${items.map((item) => {
        const detail = [
          item.forecast ? `fcst ${item.forecast}` : "",
          item.previous ? `prev ${item.previous}` : "",
        ].filter(Boolean).join(" · ");
        return `
          <li class="print-row">
            <span class="when">${esc(item.time)}</span>
            <span>${esc(item.title)}</span>
            <span class="hl">${esc(detail)}</span>
          </li>
        `;
      }).join("")}
    </ul>
  `;
}

function rollToday(widget) {
  const day = localDay();
  if (widget.day === day) return false;
  widget.items = (widget.items || []).filter((item) => !item.done);
  widget.day = day;
  return true;
}

function paintToday(widget) {
  const body = bodyOf(widget.id);
  if (!body) return;
  const rolled = rollToday(widget);
  const items = widget.items || [];
  body.dataset.ready = "1";
  body.innerHTML = `
    <ul class="agenda">
      ${items.map((item) => `
        <li class="${item.done ? "done" : ""}">
          <input type="checkbox" data-check="${esc(item.id)}" ${item.done ? "checked" : ""} aria-label="Done: ${esc(item.text)}" />
          <span>${esc(item.text)}</span>
          <button type="button" class="x" data-drop-item="${esc(item.id)}" aria-label="Remove ${esc(item.text)}">×</button>
        </li>
      `).join("")}
    </ul>
    <form class="agenda-form" data-agenda>
      <input name="text" maxlength="120" placeholder="Add for today" aria-label="Agenda line" required />
      <button type="submit" class="text-btn">Add</button>
    </form>
    <div class="feed-events" id="feed-${esc(widget.id)}"></div>
    <form class="feed-form" data-feed>
      <input name="feed" placeholder="Calendar link, https://…" aria-label="Calendar link" value="${esc(widget.feed || "")}" />
      <button type="submit" class="text-btn">Set</button>
    </form>
  `;
  if (rolled) save();
  loadAgenda(widget);
}

function loadAgenda(widget) {
  const root = document.getElementById(`feed-${widget.id}`);
  if (!root || !widget.feed) return;
  const key = `agenda:${widget.feed}:${localDay()}`;
  const hit = dataCache.get(key);
  if (hit && Date.now() - hit.at < 600000) {
    paintAgendaFeed(widget, hit.data);
    return;
  }
  const query = new URLSearchParams({
    url: widget.feed,
    day: localDay(),
    offset: String(new Date().getTimezoneOffset()),
  });
  getJson(`/api/agenda?${query}`)
    .then((data) => {
      dataCache.set(key, { at: Date.now(), data });
      paintAgendaFeed(widget, data);
    })
    .catch((error) => paintAgendaFeed(widget, { items: [], error: error.message || "That calendar didn't load." }));
}

function paintAgendaFeed(widget, data) {
  const root = document.getElementById(`feed-${widget.id}`);
  if (!root) return;
  const items = data.items || [];
  if (data.error) {
    root.innerHTML = `<p class="note feed-note">${esc(data.error)}</p>`;
    return;
  }
  if (!items.length) {
    root.innerHTML = "";
    return;
  }
  root.innerHTML = `
    <ul class="agenda">
      ${items.map((item) => `
        <li>
          <span class="when">${esc(item.time)}</span>
          <span>${esc(item.title)}</span>
          <span></span>
        </li>
      `).join("")}
    </ul>
  `;
}

let ledeTimer = 0;
let ledeToken = 0;

function scheduleLede() {
  clearTimeout(ledeTimer);
  ledeTimer = setTimeout(refreshLede, 400);
}

function gatherLede() {
  const facts = {};
  const weather = widgets.find((widget) => widget.type === "weather");
  if (weather) {
    const hit = dataCache.get(cacheKey(weather));
    if (hit && hit.data && hit.data.temp != null) {
      const data = hit.data;
      const wet = /rain|drizzle|shower|thunder|snow/i.test(data.label || "");
      const days = data.days || [];
      const soon = days.find((day, index) => index > 0 && Number(day.pop) >= 40)
        || days.find((day) => Number(day.pop) >= 50);
      let rain = "";
      if (soon && !(soon.label === "Today" && wet)) {
        rain = `rain likely ${soon.label === "Today" ? "today" : soon.label}`;
      }
      facts.weather = {
        temp: data.temp,
        unit: data.unit === "c" ? "c" : "f",
        label: data.label || "Weather",
        place: data.place || weather.place || "",
        rain,
      };
    }
  }
  const overnight = widgets.find((widget) => widget.type === "overnight");
  if (overnight) {
    const hit = dataCache.get(cacheKey(overnight));
    const moves = (hit && hit.data && hit.data.moves) || [];
    const ranked = moves.map((move) => ({ move, view: formatMove(move) }));
    ranked.sort((a, b) => b.view.score - a.view.score);
    const top = ranked[0];
    if (top) {
      const move = top.move;
      const amount = move.kind === "yield"
        ? Math.abs((move.price - move.previousClose) * 100)
        : Math.abs(move.changePercent);
      const direction = move.kind === "yield"
        ? (move.price - move.previousClose)
        : move.changePercent;
      let text = "flat";
      if (amount >= 0.05) {
        text = move.kind === "yield"
          ? `${direction > 0 ? "up" : "down"} ${amount.toFixed(1)} bp`
          : `${direction > 0 ? "up" : "down"} ${amount.toFixed(1)}%`;
      }
      facts.move = { label: move.label, text };
    }
  }
  const news = widgets.find((widget) => widget.type === "headlines" || widget.type === "stock-news" || widget.type === "btc-news");
  if (news) {
    const hit = dataCache.get(cacheKey(news));
    const title = hit && hit.data && hit.data.items && hit.data.items[0] && hit.data.items[0].title;
    if (title) facts.headline = title;
  }
  const debt = widgets.find((widget) => widget.type === "debt");
  if (debt) {
    const hit = dataCache.get(cacheKey(debt));
    const data = hit && hit.data;
    const total = data && trillionsLabel(data.total);
    if (total) {
      const delta = Number(data.prior && data.prior.delta);
      let change = "";
      if (Number.isFinite(delta) && delta !== 0) {
        change = `${delta > 0 ? "up" : "down"} ${compactDebt(Math.abs(delta)).replace(/^[+−-]/, "")}`;
      }
      else if (delta === 0) change = "unchanged";
      facts.debt = { total, change };
    }
  }
  return facts.weather || facts.move || facts.headline || facts.debt ? facts : null;
}

async function refreshLede() {
  const el = document.getElementById("brief-lede");
  if (!el) return;
  const facts = gatherLede();
  const token = ++ledeToken;
  if (!facts) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  try {
    const data = await getJson("/api/lede", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts }),
    });
    if (token !== ledeToken) return;
    el.hidden = !data.text;
    el.textContent = data.text || "";
  } catch {
    if (token !== ledeToken) return;
  }
}

function paintWeather(widget, data) {
  const body = bodyOf(widget.id);
  if (!body) return;
  if (data.place) setLabel(widget.id, data.place);
  const view = widget.span === "week" ? "week" : "day";
  const cells = view === "week"
    ? (data.days || []).map((day) => {
        const rain = day.pop == null ? "" : `${day.pop}%`;
        return `
      <div class="hour" title="${esc([day.text, rain && `${rain} chance of precip`].filter(Boolean).join(" · "))}" aria-label="${esc(day.label)}, high ${esc(day.high)}°, low ${esc(day.low)}°${rain ? `, ${rain} chance of precipitation` : ""}, ${esc(day.text || "")}">
        <span>${esc(day.label)}</span><b>${esc(day.high)}°</b><b class="lo">${esc(day.low)}°</b>${rain ? `<span class="pop">${esc(rain)}</span>` : ""}
      </div>
    `;
      }).join("")
    : (data.hourly || []).map((hour) => `
      <div class="hour"><span>${esc(hour.label)}</span><b>${esc(hour.temp)}°</b></div>
    `).join("");
  const high = data.high == null ? "" : `H ${data.high}°`;
  const low = data.low == null ? "" : `L ${data.low}°`;
  const wind = data.wind ? `Wind ${data.wind}` : "";
  body.dataset.ready = "1";
  body.innerHTML = `
    <div class="wx">
      <div>
        <div class="temp-row">
          <div class="temp">${esc(data.temp)}°</div>
          <div class="wx-switches">
            <div class="toggles" role="group" aria-label="Temperature unit">
              <button type="button" data-unit="f" aria-pressed="${unit === "f"}">°F</button>
              <button type="button" data-unit="c" aria-pressed="${unit === "c"}">°C</button>
            </div>
            <div class="toggles" role="group" aria-label="Forecast">
              <button type="button" data-forecast="day" aria-pressed="${view === "day"}">Day</button>
              <button type="button" data-forecast="week" aria-pressed="${view === "week"}">Week</button>
            </div>
          </div>
        </div>
        <p class="cond">${esc(data.label || "Weather")}</p>
        <p class="hl">${esc([high, low, wind].filter(Boolean).join(" · "))}</p>
      </div>
      <div class="hours${view === "week" ? " days" : ""}">${cells}</div>
    </div>
  `;
}

function paintWeatherPrompt(widget) {
  const body = bodyOf(widget.id);
  if (!body) return;
  body.dataset.ready = "1";
  body.innerHTML = `
    <p class="prompt-copy">Where should this sit?</p>
    <form class="city-form" data-city>
      <input name="place" placeholder="Kyoto" aria-label="City" required />
      <button type="submit" class="text-btn">Set</button>
    </form>
    <button type="button" class="text-btn" data-geo>Use my location</button>
  `;
}

function paintNews(widget, data) {
  const body = bodyOf(widget.id);
  if (!body) return;
  const items = data.items || [];
  const toggles = widget.type === "headlines" && !widget.query ? "" : `
    <div class="toggles" role="group" aria-label="News window">
      ${["today", "week"].map((value) => `
        <button type="button" data-window="${value}" aria-pressed="${(widget.window || "today") === value}">
          ${value === "today" ? "Today" : "Week"}
        </button>
      `).join("")}
    </div>
  `;
  const note = data.note ? `<p class="note">${esc(data.note)}</p>` : "";
  const stories = items.length
    ? items.map((item) => {
        const href = safeUrl(item.url);
        const open = href ? `href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : "";
        const tag = href ? "a" : "div";
        return `
          <${tag} class="story" ${open}>
            <span class="when">${esc(ago(item.published))}</span>
            <span class="hed">${esc(item.title)}</span>
            <span class="src">${esc(item.source || "")}</span>
          </${tag}>
        `;
      }).join("")
    : `<p class="note">Nothing on the wire.</p>`;
  body.dataset.ready = "1";
  body.innerHTML = `${note}<div class="stories">${stories}</div>${toggles}`;
}

function paintChart(widget, data) {
  const body = bodyOf(widget.id);
  if (!body) return;
  const points = data.points || [];
  if (!points.length) {
    paintError(widget, "No prints for that range.");
    return;
  }
  const range = widget.range || "1D";
  const symbol = data.symbol === "BTC-USD" ? "BTC" : data.symbol;
  const digits = priceDigits(data.price);
  const mood = tone(data.changePercent);
  const basis = range === "1D" ? "vs prior close" : "vs range start";
  const when = data.marketTime ? clockTime(data.marketTime) : "";
  const href = safeUrl(`https://finance.yahoo.com/quote/${encodeURIComponent(data.symbol)}`);
  const mid = points[Math.floor((points.length - 1) / 2)];
  body.dataset.ready = "1";
  body.innerHTML = `
    <div class="quote">
      <div>
        <a class="name" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(data.name || symbol)}</a>
        <div class="sub">${esc(symbol)}${when ? ` · ${esc(when)}` : ""} · ${basis}</div>
      </div>
      <div>
        <div class="px">${esc(formatNum(data.price, digits))}</div>
        <div class="chg ${mood}">${esc(signed(data.changePercent, 2))}%</div>
      </div>
    </div>
    ${chartSvg(points, range === "1D" ? data.base : null, mood, `${data.name || symbol}, ${signed(data.changePercent, 2)} percent`)}
    <div class="tip" hidden></div>
    <div class="axis">
      <span>${esc(axisLabel(points[0].t, range))}</span>
      <span>${esc(axisLabel(mid.t, range))}</span>
      <span>${esc(axisLabel(points[points.length - 1].t, range))}</span>
    </div>
    <div class="toggles" role="group" aria-label="Chart range">
      ${CHART_RANGES.map((value) => `
        <button type="button" data-range="${value}" aria-pressed="${range === value}">${value}</button>
      `).join("")}
    </div>
  `;
  bindChart(body, points, digits, range);
}

function axisLabel(unix, range) {
  const date = new Date(unix * 1000);
  if (range === "5Y") return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  if (range === "1Y" || range === "3M" || range === "1M") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "5D") {
    return `${date.toLocaleDateString("en-US", { weekday: "short" })} ${date.toLocaleTimeString("en-US", { hour: "numeric" })}`;
  }
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function pointWhen(unix, range) {
  if (range === "5Y" || range === "1Y" || range === "3M" || range === "1M") {
    return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return axisLabel(unix, range);
}

function chartSvg(points, base, mood, label) {
  const width = 640;
  const height = 156;
  const padX = 2;
  const padY = 12;
  let min = Math.min(...points.map((point) => point.v));
  let max = Math.max(...points.map((point) => point.v));
  if (base != null) {
    min = Math.min(min, base);
    max = Math.max(max, base);
  }
  if (max - min < 1e-9) {
    min -= 1;
    max += 1;
  } else {
    const pad = (max - min) * 0.14;
    min -= pad;
    max += pad;
  }
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const x = (t) => padX + ((t - t0) / (t1 - t0 || 1)) * (width - padX * 2);
  const y = (v) => padY + (1 - (v - min) / (max - min)) * (height - padY * 2);
  const line = points.map((point, index) => `${index ? "L" : "M"}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`).join(" ");
  const lastX = x(points[points.length - 1].t).toFixed(1);
  const firstX = x(points[0].t).toFixed(1);
  const area = `${line} L${lastX},${height} L${firstX},${height} Z`;
  const tone = mood === "down" ? "down" : mood === "up" ? "up" : "flat";
  const guide = base == null
    ? ""
    : `<line class="chart-guide" x1="0" x2="${width}" y1="${y(base).toFixed(1)}" y2="${y(base).toFixed(1)}" stroke-dasharray="3 4" />`;
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">${guide}<path class="chart-area ${tone}" d="${area}"></path><path class="chart-line ${tone}" d="${line}"></path></svg>`;
}

function bindChart(root, points, digits, range) {
  const svg = root.querySelector(".chart");
  const tip = root.querySelector(".tip");
  if (!svg || !tip || points.length < 2) return;
  const show = (event) => {
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const target = points[0].t + ratio * (points[points.length - 1].t - points[0].t);
    let best = points[0];
    let bestDist = Infinity;
    for (const point of points) {
      const dist = Math.abs(point.t - target);
      if (dist < bestDist) {
        best = point;
        bestDist = dist;
      }
    }
    tip.hidden = false;
    tip.textContent = `${pointWhen(best.t, range)} · ${formatNum(best.v, digits)}`;
  };
  svg.addEventListener("mousemove", show);
  svg.addEventListener("mouseleave", () => {
    tip.hidden = true;
  });
}

function paintJoke(widget, joke) {
  const body = bodyOf(widget.id);
  if (!body) return;
  body.dataset.ready = "1";
  body.innerHTML = `<blockquote class="joke-quote">“${esc(joke)}”</blockquote><button type="button" class="text-btn" data-joke="${esc(widget.id)}">Another</button>`;
}

function findWidget(id) {
  return widgets.find((widget) => widget.id === id);
}

function refreshDue() {
  if (document.hidden) return;
  for (const widget of widgets) {
    if (!FRESH[widget.type]) continue;
    if (widget.type === "weather" && !widget.place && !coords) continue;
    const hit = dataCache.get(cacheKey(widget));
    if (!hit || Date.now() - hit.at >= FRESH[widget.type]) loadTile(widget);
  }
}

function requestGeo() {
  if (!navigator.geolocation) {
    geoState = "denied";
    widgets.filter((widget) => widget.type === "weather" && !widget.place).forEach(paintWeatherPrompt);
    return;
  }
  geoState = "pending";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoState = "ready";
      coords = {
        lat: Math.round(pos.coords.latitude * 100) / 100,
        lon: Math.round(pos.coords.longitude * 100) / 100,
      };
      try {
        localStorage.setItem("brief.coords", JSON.stringify(coords));
      } catch {
        /* ignore */
      }
      widgets.filter((widget) => widget.type === "weather" && !widget.place).forEach(loadTile);
    },
    () => {
      geoState = coords ? "ready" : "denied";
      if (!coords) {
        widgets.filter((widget) => widget.type === "weather" && !widget.place).forEach(paintWeatherPrompt);
      }
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 30 * 60 * 1000 }
  );
}

function showReply(text, isError) {
  replyEl.textContent = text || "";
  replyEl.classList.toggle("error", Boolean(isError));
}

async function ask(message) {
  askBtn.disabled = true;
  const previous = askBtn.textContent;
  askBtn.textContent = "…";
  showReply("Editing the brief…");
  try {
    const data = await getJson("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, widgets, history: history.slice(-8) }),
    });
    if (!Array.isArray(data.widgets)) throw new Error("Grok returned an unusable edit.");
    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: data.reply || "" });
    history = history.slice(-8);
    widgets = data.widgets.filter(validWidget);
    save();
    render();
    showReply(data.reply || "Done.");
    const focus = (data.focus || [])[0];
    const tile = focus && document.querySelector(`[data-id="${CSS.escape(focus)}"]`);
    if (tile) tile.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  } catch (error) {
    showReply(error.message || "The brief server didn't answer.", true);
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = previous;
  }
}

const ADD_KINDS = {
  ticker: {
    label: "Ticker",
    placeholder: "NVDA",
    hint: "Symbol or company. Enter adds the change.",
  },
  news: {
    label: "Headlines",
    placeholder: "World, or a phrase",
    hint: "A section name, or any phrase. Enter adds the headlines.",
  },
  widget: {
    label: "Widget",
    placeholder: "City for the weather",
    hint: "A city fills in the weather. Enter adds the weather there.",
  },
};
const NEWS_SECTION = {
  world: "world",
  business: "business",
  tech: "tech",
  technology: "tech",
  bitcoin: "bitcoin",
  btc: "bitcoin",
};
const TICKER_NOUN = {
  change: "change",
  chart: "chart",
  news: "news",
  both: "chart and news",
};
let addKind = "ticker";
let tickerMode = "change";
let addBusy = false;

function tickerHint() {
  return `Symbol or company. Enter adds the ${TICKER_NOUN[tickerMode]}.`;
}

function setTickerMode(mode) {
  if (!TICKER_NOUN[mode]) return;
  tickerMode = mode;
  addMenu.querySelectorAll('[data-panel="ticker"] [data-add]').forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.add === tickerMode ? "true" : "false");
  });
  if (addKind === "ticker") addHint.textContent = tickerHint();
}

function cleanQuery(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function slotOf(widget) {
  if (widget.type === "stock-chart" || widget.type === "stock-news" || widget.type === "change") {
    return `${widget.type}:${String(widget.symbol || "").toUpperCase()}`;
  }
  if (widget.type === "headlines") {
    if (widget.query) return `headlines:q:${widget.query.trim().toLowerCase()}`;
    return `headlines:${widget.topic}`;
  }
  return widget.type;
}

function scrollToWidget(id) {
  const tile = id && document.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (tile) tile.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
}

function insertWidgets(specs) {
  const added = [];
  const already = [];
  let full = false;
  let cursor = widgets[0] && widgets[0].type === "overnight" ? 1 : 0;
  for (const spec of specs) {
    if (spec.type === "weather") {
      const existing = widgets.find((widget) => widget.type === "weather");
      if (existing) {
        if (spec.place && existing.place !== spec.place) {
          existing.place = spec.place;
          added.push(existing);
        } else {
          already.push(existing);
        }
        continue;
      }
    }
    const existing = widgets.find((widget) => slotOf(widget) === slotOf(spec));
    if (existing) {
      already.push(existing);
      continue;
    }
    if (widgets.length >= 24) {
      full = true;
      break;
    }
    const widget = { id: uid(), ...spec };
    widgets.splice(cursor, 0, widget);
    cursor += 1;
    added.push(widget);
  }
  if (added.length) {
    save();
    render();
    scrollToWidget(added[0].id);
  } else if (already[0]) {
    scrollToWidget(already[0].id);
  }
  return { added, already, full };
}

function finishAdd(result, reply) {
  if (!result.added.length && result.already.length) {
    showReply("That's already on the brief.");
    return;
  }
  if (!result.added.length) {
    showReply("The desk is full.", true);
    return;
  }
  let text = reply;
  if (result.already.length) text += " The rest was already on the brief.";
  if (result.full) text += " The desk is full.";
  showReply(text);
  addQuery.value = "";
}

function isBitcoinSymbol(symbol) {
  const text = String(symbol || "").toUpperCase();
  return text === "BTC-USD" || text === "BTC" || text === "XBT";
}

async function resolveTicker(text) {
  return getJson(`/api/symbol?q=${encodeURIComponent(text)}`);
}

function setAddBusy(busy) {
  addBusy = busy;
  addMenu.setAttribute("aria-busy", busy ? "true" : "false");
}

async function addTicker(mode) {
  const text = cleanQuery(addQuery.value);
  if (!text) {
    showReply("Type a ticker or a company.");
    addQuery.focus();
    return;
  }
  setAddBusy(true);
  showReply(`Looking up ${text}…`);
  try {
    const hit = await resolveTicker(text);
    const symbol = isBitcoinSymbol(hit.symbol) ? "BTC-USD" : hit.symbol;
    const specs = [];
    if (mode === "change") {
      specs.push({ type: "change", symbol });
    } else if (isBitcoinSymbol(symbol)) {
      if (mode !== "news") specs.push({ type: "btc-chart", range: "1D" });
      if (mode !== "chart") specs.push({ type: "btc-news", window: "today" });
    } else {
      if (mode !== "news") specs.push({ type: "stock-chart", symbol, range: "1D" });
      if (mode !== "chart") specs.push({ type: "stock-news", symbol, window: "today" });
    }
    const result = insertWidgets(specs);
    const shown = changeLabel(symbol);
    const noun = mode === "change" ? "change" : mode === "chart" ? "chart" : mode === "news" ? "news" : "chart and news";
    finishAdd(result, `Added ${shown} ${noun}.`);
  } catch (error) {
    showReply(error.message || "Couldn't find that ticker.", true);
  } finally {
    setAddBusy(false);
  }
}

function addHeadlines() {
  const text = cleanQuery(addQuery.value);
  if (!text) {
    showReply("Type a section or a phrase.");
    addQuery.focus();
    return;
  }
  const section = NEWS_SECTION[text.toLowerCase()];
  const specs = section === "bitcoin"
    ? [{ type: "btc-news", window: "today" }]
    : section
      ? [{ type: "headlines", topic: section }]
      : [{ type: "headlines", query: text, window: "today" }];
  const result = insertWidgets(specs);
  const label = section === "bitcoin" ? "bitcoin news" : section ? `${section} headlines` : `headlines for “${text}”`;
  finishAdd(result, `Added ${label}.`);
}

function addNamedWidget(kind) {
  const city = cleanQuery(addQuery.value);
  if (kind === "weather") {
    const skip = new Set(["joke", "markets", "overnight", "weather", "bitcoin", "btc", "debt", "today", "agenda", "calendar"]);
    const place = city && !skip.has(city.toLowerCase()) ? city : "";
    const result = insertWidgets([place ? { type: "weather", place } : { type: "weather" }]);
    finishAdd(result, place ? `Added the weather in ${place}.` : "Added the weather.");
    return;
  }
  const labels = {
    overnight: "overnight moves",
    joke: "a joke",
    debt: "the national debt",
    today: "today's agenda",
    "btc-chart": "a bitcoin chart",
    "btc-news": "bitcoin news",
  };
  const spec = kind === "btc-chart"
    ? { type: "btc-chart", range: "1D" }
    : kind === "btc-news"
      ? { type: "btc-news", window: "today" }
      : { type: kind };
  finishAdd(insertWidgets([spec]), `Added ${labels[kind] || "a widget"}.`);
}

function submitAddKind() {
  if (addBusy) return;
  if (addKind === "ticker") {
    addTicker(tickerMode);
    return;
  }
  if (addKind === "news") {
    addHeadlines();
    return;
  }
  const word = {
    markets: "overnight",
    overnight: "overnight",
    joke: "joke",
    debt: "debt",
    "national debt": "debt",
    "us debt": "debt",
    weather: "weather",
    today: "today",
    agenda: "today",
    calendar: "today",
    schedule: "today",
    "bitcoin chart": "btc-chart",
    "bitcoin news": "btc-news",
  }[cleanQuery(addQuery.value).toLowerCase()];
  if (word) {
    addNamedWidget(word);
    return;
  }
  const text = cleanQuery(addQuery.value).toLowerCase();
  if (text === "bitcoin" || text === "btc") {
    finishAdd(insertWidgets([
      { type: "btc-chart", range: "1D" },
      { type: "btc-news", window: "today" },
    ]), "Added a bitcoin chart and bitcoin news.");
    return;
  }
  addNamedWidget("weather");
}

function setAddKind(kind) {
  addKind = ADD_KINDS[kind] ? kind : "ticker";
  const meta = ADD_KINDS[addKind];
  addMenu.querySelectorAll("[data-kind]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.kind === addKind ? "true" : "false");
  });
  addMenu.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== addKind;
  });
  addQuery.placeholder = meta.placeholder;
  addLabel.textContent = meta.label;
  addHint.textContent = addKind === "ticker" ? tickerHint() : meta.hint;
}

function setAddOpen(open) {
  addMenu.hidden = !open;
  addToggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) addQuery.focus();
}

function bootChips() {
  chipsEl.innerHTML = CHIPS.map(([label, prompt]) => `
    <button type="button" class="chip" data-prompt="${esc(prompt)}">${esc(label)}</button>
  `).join("");
}

async function bootHealth() {
  try {
    const data = await getJson("/api/health");
    grokOn = Boolean(data.grok);
  } catch {
    grokOn = false;
  }
  grokEl.textContent = grokOn ? "Grok" : "Phrases";
  grokEl.classList.toggle("on", grokOn);
  grokEl.title = grokOn
    ? "Grok edits the brief from plain language."
    : "Add XAI_API_KEY to a .env file for full language. Short phrases still work.";
  input.placeholder = grokOn
    ? "Ask Grok — “NVDA this week”, “weather in Kyoto”"
    : "Add a widget — “NVDA this week”, “weather in Kyoto”";
}

board.addEventListener("click", (event) => {
  const move = event.target.closest("[data-move]");
  if (move) {
    if (!move.disabled) moveWidget(move.dataset.id, move.dataset.move);
    return;
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    widgets = widgets.filter((widget) => widget.id !== remove.dataset.remove);
    save();
    render();
    return;
  }
  const tile = event.target.closest(".tile");
  if (!tile) return;
  const widget = findWidget(tile.dataset.id);
  if (!widget) return;
  const range = event.target.closest("[data-range]");
  if (range && widget.range !== range.dataset.range) {
    widget.range = range.dataset.range;
    save();
    loadTile(widget);
    return;
  }
  const windowBtn = event.target.closest("[data-window]");
  if (windowBtn && widget.window !== windowBtn.dataset.window) {
    widget.window = windowBtn.dataset.window;
    save();
    loadTile(widget);
    return;
  }
  const forecastBtn = event.target.closest("[data-forecast]");
  if (forecastBtn && widget.type === "weather") {
    const next = forecastBtn.dataset.forecast === "week" ? "week" : "day";
    if ((widget.span === "week" ? "week" : "day") === next) return;
    widget.span = next;
    save();
    const hit = dataCache.get(cacheKey(widget));
    if (hit && Array.isArray(hit.data.days)) paint(widget, hit.data);
    else {
      dataCache.delete(cacheKey(widget));
      loadTile(widget);
    }
    return;
  }
  const unitBtn = event.target.closest("[data-unit]");
  if (unitBtn && unit !== unitBtn.dataset.unit) {
    unit = unitBtn.dataset.unit === "c" ? "c" : "f";
    try {
      localStorage.setItem("brief.unit", unit);
    } catch {
      /* ignore */
    }
    widgets.filter((item) => item.type === "weather").forEach(loadTile);
    return;
  }
  if (event.target.closest("[data-joke]")) {
    loadJoke(widget, true);
    return;
  }
  if (event.target.closest("[data-geo]")) {
    widget.place = undefined;
    delete widget.place;
    save();
    requestGeo();
    return;
  }
  if (event.target.closest("[data-retry]")) {
    dataCache.delete(cacheKey(widget));
    const body = bodyOf(widget.id);
    if (body) body.dataset.ready = "0";
    loadTile(widget);
    return;
  }
  const dropItem = event.target.closest("[data-drop-item]");
  if (dropItem && widget.type === "today") {
    widget.items = (widget.items || []).filter((item) => item.id !== dropItem.dataset.dropItem);
    save();
    paintToday(widget);
  }
});

board.addEventListener("change", (event) => {
  const box = event.target.closest("[data-check]");
  if (!box) return;
  const tile = box.closest(".tile");
  const widget = tile && findWidget(tile.dataset.id);
  if (!widget || widget.type !== "today") return;
  const item = (widget.items || []).find((entry) => entry.id === box.dataset.check);
  if (!item) return;
  item.done = box.checked;
  const row = box.closest("li");
  if (row) row.classList.toggle("done", item.done);
  save();
});

board.addEventListener("submit", (event) => {
  const city = event.target.closest("[data-city]");
  if (city) {
    event.preventDefault();
    const tile = city.closest(".tile");
    const widget = tile && findWidget(tile.dataset.id);
    const place = String(new FormData(city).get("place") || "").trim();
    if (!widget || !place) return;
    widget.place = place;
    save();
    loadTile(widget);
    return;
  }
  const agenda = event.target.closest("[data-agenda]");
  if (agenda) {
    event.preventDefault();
    const tile = agenda.closest(".tile");
    const widget = tile && findWidget(tile.dataset.id);
    const text = String(new FormData(agenda).get("text") || "").replace(/\s+/g, " ").trim();
    if (!widget || !text) return;
    widget.items = widget.items || [];
    widget.items.push({ id: uid(), text: text.slice(0, 120), done: false });
    widget.day = localDay();
    save();
    paintToday(widget);
    const input = bodyOf(widget.id) && bodyOf(widget.id).querySelector("[data-agenda] input");
    if (input) input.focus();
    return;
  }
  const feed = event.target.closest("[data-feed]");
  if (!feed) return;
  event.preventDefault();
  const tile = feed.closest(".tile");
  const widget = tile && findWidget(tile.dataset.id);
  if (!widget) return;
  let link = String(new FormData(feed).get("feed") || "").trim();
  if (link.toLowerCase().startsWith("webcal://")) link = `https://${link.slice(9)}`;
  if (link && !/^https:\/\//i.test(link)) {
    showReply("Use an https calendar link.", true);
    return;
  }
  if (link) widget.feed = link;
  else delete widget.feed;
  save();
  paintToday(widget);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) {
    showReply("Name a ticker, bitcoin, the weather, headlines, the national debt, an agenda, or a joke.");
    return;
  }
  input.value = "";
  ask(message);
});

chipsEl.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-prompt]");
  if (!chip) return;
  input.value = chip.dataset.prompt;
  form.requestSubmit();
});

addToggle.addEventListener("click", () => {
  setAddOpen(addMenu.hidden);
});

addMenu.addEventListener("click", (event) => {
  const kind = event.target.closest("[data-kind]");
  if (kind) {
    setAddKind(kind.dataset.kind);
    addQuery.focus();
    return;
  }
  const action = event.target.closest("[data-add]");
  if (!action || addBusy) return;
  const name = action.dataset.add;
  if (name === "chart" || name === "news" || name === "both" || name === "change") {
    setTickerMode(name);
    if (!cleanQuery(addQuery.value)) {
      addQuery.focus();
      return;
    }
    addTicker(name);
    return;
  }
  if (name === "headlines") addHeadlines();
  else addNamedWidget(name);
});

addQuery.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitAddKind();
  }
});

document.addEventListener("click", (event) => {
  if (addMenu.hidden) return;
  if (event.target.closest("#add-menu") || event.target.closest("#add-toggle")) return;
  setAddOpen(false);
});

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (event.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
    event.preventDefault();
    input.focus();
  }
  if (event.key === "Escape") {
    if (!addMenu.hidden) {
      setAddOpen(false);
      addToggle.focus();
      return;
    }
    if (document.activeElement === input) {
      input.value = "";
      input.blur();
    }
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshDue();
});

function savedTheme() {
  try {
    const saved = localStorage.getItem("brief.theme");
    return saved === "dark" || saved === "light" ? saved : "";
  } catch {
    return "";
  }
}

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = dark ? "dark" : "light";
  const button = document.getElementById("theme-toggle");
  if (!button) return;
  button.setAttribute("aria-pressed", dark ? "true" : "false");
  button.textContent = dark ? "Day" : "Night";
  button.title = dark ? "Switch to day" : "Switch to night";
}

function bootTheme() {
  applyTheme(savedTheme() || systemTheme());
  const button = document.getElementById("theme-toggle");
  if (button) {
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("brief.theme", next);
      } catch {
        /* ignore */
      }
      applyTheme(next);
    });
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const followSystem = () => {
    if (!savedTheme()) applyTheme(systemTheme());
  };
  if (media.addEventListener) media.addEventListener("change", followSystem);
  else media.addListener(followSystem);
}

async function boot() {
  bootTheme();
  try {
    unit = localStorage.getItem("brief.unit") === "c" ? "c" : "f";
    const saved = JSON.parse(localStorage.getItem("brief.coords") || "null");
    if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) {
      coords = saved;
      geoState = "ready";
    }
  } catch {
    unit = "f";
  }
  let stored = null;
  let fromServer = false;
  try {
    const data = await getJson("/api/board");
    fromServer = true;
    if (Array.isArray(data.widgets)) stored = data.widgets.filter(validWidget);
  } catch {
    fromServer = false;
  }
  if (fromServer && Array.isArray(stored)) {
    widgets = stored;
    try {
      localStorage.setItem("brief.debt.seeded", "1");
      localStorage.setItem("brief.today.seeded", "1");
    } catch {
      /* ignore */
    }
  } else {
    widgets = ensureToday(ensureDebt(loadBoard() || defaults()));
  }
  boardReady = true;
  if (fromServer && !Array.isArray(stored)) save();
  else saveLocal();
  try {
    if (widgets.some((widget) => widget.type === "debt")) localStorage.setItem("brief.debt.seeded", "1");
    if (widgets.some((widget) => widget.type === "today")) localStorage.setItem("brief.today.seeded", "1");
  } catch {
    /* ignore */
  }
  bootChips();
  renderMast();
  render();
  if (widgets.some((widget) => widget.type === "weather" && !widget.place)) requestGeo();
  bootHealth();
  bootPet();
  setInterval(renderMast, 15000);
  setInterval(refreshDue, 10000);
}

boot();
