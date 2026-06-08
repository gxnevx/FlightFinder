"""Fonte opcional: Travelpayouts / Aviasales Data API (terceira fonte de preço
e explorador de datas baratas).

Token grátis (sem cartão) no perfil após cadastro em https://www.travelpayouts.com
Docs: https://travelpayouts.github.io/slate/  ·  header X-Access-Token.

São dados de cache (2 a 7 dias): servem como tendência e referência de datas,
não como preço exato em tempo real. Sem token, a fonte é simplesmente pulada.
"""
from __future__ import annotations

import json
import os

from .. import netutil
from ..model import Offer, SourceResult

BASE = "https://api.travelpayouts.com"


def token() -> str:
    return os.environ.get("TRAVELPAYOUTS_TOKEN", "").strip()


def _headers() -> dict:
    return {"X-Access-Token": token(), "Accept-Encoding": "gzip, deflate"}


def search(origin, dest, date_from=None, return_from=None, currency="usd") -> SourceResult:
    if not token():
        return SourceResult("Travelpayouts", error="sem token (opcional)")
    url = (f"{BASE}/v1/prices/cheap?origin={origin}&destination={dest}"
           f"&currency={currency}")
    try:
        d = json.loads(netutil.fetch(url, headers=_headers(), retries=1).decode("utf-8", "replace"))
    except Exception as e:
        return SourceResult("Travelpayouts", error=f"{type(e).__name__}")
    if not d.get("success", True):
        return SourceResult("Travelpayouts", error="token inválido ou sem dados")
    res = SourceResult("Travelpayouts")
    for _, v in ((d.get("data") or {}).get(dest) or {}).items():
        p = v.get("price")
        res.offers.append(Offer(
            source="Travelpayouts (cache)", airline=str(v.get("airline", "") or ""),
            price=float(p) if p is not None else None, currency=currency.upper(),
            departure=str(v.get("departure_at", "")), arrival=str(v.get("return_at", "")),
        ))
    return res


def cheapest_dates(origin, dest, month: str, currency="usd") -> dict | None:
    """Calendário do mês: retorna a data mais barata (referência, dados de cache)."""
    if not token():
        return None
    url = (f"{BASE}/v1/prices/calendar?origin={origin}&destination={dest}"
           f"&depart_date={month}&currency={currency}&calendar_type=departure_date")
    try:
        d = json.loads(netutil.fetch(url, headers=_headers(), retries=1).decode("utf-8", "replace"))
    except Exception:
        return None
    data = d.get("data") or {}
    best = None
    for day, v in data.items():
        p = v.get("price")
        if p is not None and (best is None or p < best[1]):
            best = (day, float(p), currency.upper())
    if not best:
        return None
    return {"date": best[0], "price": best[1], "currency": best[2]}
