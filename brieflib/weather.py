"""Local weather from Open-Meteo, with a city name when we can find one."""

from __future__ import annotations

import urllib.parse
from datetime import date

from brieflib.net import UpstreamError, cache_get, cache_set, fetch_json

WEEKDAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

LABELS = {
    0: "Clear",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Fog",
    51: "Drizzle",
    53: "Drizzle",
    55: "Drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Showers",
    81: "Showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Thunderstorm",
}


def get_weather(
    *,
    place: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    unit: str = "f",
) -> dict:
    unit = "c" if unit == "c" else "f"
    if place:
        geo = _geocode(place)
        lat = geo["lat"]
        lon = geo["lon"]
        label = geo["label"]
    else:
        if lat is None or lon is None or not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise UpstreamError("Share a city or your location.")
        label = _reverse(lat, lon)

    key = f"wx:{round(float(lat), 2)}:{round(float(lon), 2)}:{unit}"
    cached = cache_get(key)
    if cached is not None:
        payload = dict(cached)
        payload["place"] = label
        return payload

    wind_name = "kmh" if unit == "c" else "mph"
    wind_suffix = "km/h" if unit == "c" else "mph"
    url = "https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode({
        "latitude": f"{float(lat):.4f}",
        "longitude": f"{float(lon):.4f}",
        "current": "temperature_2m,weather_code,wind_speed_10m",
        "hourly": "temperature_2m",
        "daily": "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
        "temperature_unit": "celsius" if unit == "c" else "fahrenheit",
        "wind_speed_unit": wind_name,
        "timezone": "auto",
        "forecast_days": 7,
    })
    data = fetch_json(url)
    current = data.get("current") or {}
    hourly = data.get("hourly") or {}
    daily = data.get("daily") or {}
    if "temperature_2m" not in current:
        raise UpstreamError("Weather didn't load.")

    times = hourly.get("time") or []
    temps = hourly.get("temperature_2m") or []
    now = current.get("time") or ""
    index = 0
    for i, stamp in enumerate(times):
        if stamp <= now:
            index = i
        else:
            break
    hours = []
    for i in range(index, min(index + 8, len(times))):
        if i >= len(temps) or temps[i] is None:
            continue
        hours.append({"label": _hour(times[i]), "temp": round(temps[i])})

    highs = daily.get("temperature_2m_max") or [None]
    lows = daily.get("temperature_2m_min") or [None]
    wind = current.get("wind_speed_10m")
    code = int(current.get("weather_code") or 0)
    payload = {
        "place": label,
        "temp": round(current["temperature_2m"]),
        "label": LABELS.get(code, "Mixed"),
        "high": None if highs[0] is None else round(highs[0]),
        "low": None if lows[0] is None else round(lows[0]),
        "wind": None if wind is None else f"{round(wind)} {wind_suffix}",
        "unit": unit,
        "hourly": hours,
        "days": _days(daily),
    }
    cache_set(key, payload, 600)
    return payload


def _days(daily: dict) -> list[dict]:
    times = daily.get("time") or []
    highs = daily.get("temperature_2m_max") or []
    lows = daily.get("temperature_2m_min") or []
    codes = daily.get("weather_code") or []
    pops = daily.get("precipitation_probability_max") or []
    days = []
    for index, stamp in enumerate(times[:7]):
        high = highs[index] if index < len(highs) else None
        low = lows[index] if index < len(lows) else None
        if high is None or low is None:
            continue
        raw_code = codes[index] if index < len(codes) else 0
        try:
            code = int(raw_code or 0)
        except (TypeError, ValueError):
            code = 0
        pop = pops[index] if index < len(pops) else None
        try:
            pop = None if pop is None else max(0, min(100, round(float(pop))))
        except (TypeError, ValueError):
            pop = None
        days.append({
            "label": "Today" if index == 0 else _weekday(str(stamp)),
            "high": round(high),
            "low": round(low),
            "text": LABELS.get(code, "Mixed"),
            "pop": pop,
        })
    return days


def _weekday(stamp: str) -> str:
    try:
        parsed = date.fromisoformat(stamp[:10])
    except ValueError:
        return ""
    return WEEKDAYS[parsed.weekday()]


def _hour(stamp: str) -> str:
    hour = int(stamp[11:13])
    suffix = "a" if hour < 12 else "p"
    return f"{hour % 12 or 12}{suffix}"


def _geocode(place: str) -> dict:
    key = "geo:" + place.lower()
    cached = cache_get(key)
    if cached is not None:
        return cached
    url = (
        "https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name="
        + urllib.parse.quote(place)
    )
    data = fetch_json(url)
    results = data.get("results") or []
    if not results:
        raise UpstreamError(f"No city match for {place}.")
    hit = results[0]
    city = hit.get("name") or place
    admin = hit.get("admin1") or ""
    country = hit.get("country") or ""
    code = hit.get("country_code") or ""
    if code == "US" and admin and admin != city:
        label = f"{city}, {admin}"
    elif country and country != city:
        label = f"{city}, {country}"
    else:
        label = city
    payload = {"lat": hit["latitude"], "lon": hit["longitude"], "label": label}
    cache_set(key, payload, 86400)
    return payload


def _reverse(lat: float, lon: float) -> str:
    key = f"rev:{round(lat, 2)}:{round(lon, 2)}"
    cached = cache_get(key)
    if isinstance(cached, str):
        return cached
    url = (
        "https://api.bigdatacloud.net/data/reverse-geocode-client?"
        + urllib.parse.urlencode({
            "latitude": f"{lat:.4f}",
            "longitude": f"{lon:.4f}",
            "localityLanguage": "en",
        })
    )
    try:
        data = fetch_json(url)
    except UpstreamError:
        return "Your area"
    city = data.get("city") or data.get("locality") or ""
    state = data.get("principalSubdivision") or ""
    country = data.get("countryName") or ""
    code = data.get("countryCode") or ""
    if not city:
        label = "Your area"
    elif code == "US" and state:
        label = f"{city}, {state}"
    elif country:
        label = f"{city}, {country}"
    else:
        label = city
    cache_set(key, label, 86400)
    return label
