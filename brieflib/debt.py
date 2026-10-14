"""U.S. Treasury total public debt outstanding."""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from brieflib.net import UpstreamError, cache_get, cache_set, fetch_json

URL = (
    "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/"
    "v2/accounting/od/debt_to_penny"
    "?sort=-record_date&page[size]=400"
    "&fields=record_date,tot_pub_debt_out_amt,debt_held_public_amt,intragov_hold_amt"
)


def _decimal(value) -> Decimal | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return Decimal(value)
    except InvalidOperation:
        return None


def _on_or_before(rows: list[dict], target: date) -> dict | None:
    for row in rows:
        if date.fromisoformat(row["record_date"]) <= target:
            return row
    return None


def _delta(latest: Decimal, earlier: dict) -> dict | None:
    then = _decimal(earlier.get("tot_pub_debt_out_amt"))
    if then is None:
        return None
    change = (latest - then).quantize(Decimal("0.01"))
    return {"asOf": earlier["record_date"], "delta": format(change, "f")}


def get_debt() -> dict:
    cached = cache_get("debt")
    if cached:
        return cached
    data = fetch_json(URL, headers={"Accept": "application/json"})
    rows = []
    for row in data.get("data") or []:
        if not isinstance(row, dict):
            continue
        if _decimal(row.get("tot_pub_debt_out_amt")) is None or not row.get("record_date"):
            continue
        rows.append(row)
    rows.sort(key=lambda row: row["record_date"], reverse=True)
    if len(rows) < 2:
        raise UpstreamError("The Treasury debt feed didn't answer.")
    latest = rows[0]
    total = _decimal(latest["tot_pub_debt_out_amt"])
    public = _decimal(latest.get("debt_held_public_amt"))
    intragov = _decimal(latest.get("intragov_hold_amt"))
    if total is None or public is None or intragov is None:
        raise UpstreamError("The Treasury debt feed didn't answer.")
    as_of = date.fromisoformat(latest["record_date"])
    older = rows[1:]
    payload = {
        "asOf": latest["record_date"],
        "total": format(total, "f"),
        "heldByPublic": format(public, "f"),
        "intragovernmental": format(intragov, "f"),
        "prior": _delta(total, older[0]),
        "month": _delta(total, month) if (month := _on_or_before(older, as_of - timedelta(days=30))) else None,
        "year": _delta(total, year) if (year := _on_or_before(older, as_of - timedelta(days=365))) else None,
    }
    cache_set("debt", payload, 1800)
    return payload
