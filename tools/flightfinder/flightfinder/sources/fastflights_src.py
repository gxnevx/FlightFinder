"""Fonte: fast-flights (https://github.com/AWeirdDev/flights).

Scraper sem browser (usa `primp`), leve. Entrega tarifas estruturadas e o sinal
result.current_price (low/typical/high) que usamos para classificar a tarifa.
"""
from __future__ import annotations

import contextlib
import io
import re

from ..model import Offer, SourceResult

_CABIN = {"economy": "economy", "premium": "premium-economy",
          "business": "business", "first": "first"}


def _price(s) -> float | None:
    if s is None:
        return None
    m = re.search(r"[\d][\d.,]*", str(s))
    if not m:
        return None
    try:
        return float(m.group(0).replace(".", "").replace(",", ""))
    except ValueError:
        return None


def _stops(v) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def search(origin, dest, date_from, return_from=None, adults=1, cabin="economy") -> SourceResult:
    try:
        from fast_flights import FlightData, Passengers, get_flights
    except Exception as e:  # lib ausente -> degrada
        return SourceResult("fast-flights", error=f"lib indisponível: {type(e).__name__}")

    legs = [FlightData(date=date_from, from_airport=origin, to_airport=dest)]
    trip = "one-way"
    if return_from:
        legs.append(FlightData(date=return_from, from_airport=dest, to_airport=origin))
        trip = "round-trip"
    try:
        # primp imprime avisos de "impersonate" no stderr; silenciamos.
        with contextlib.redirect_stderr(io.StringIO()):
            r = get_flights(
                flight_data=legs, trip=trip, seat=_CABIN.get(cabin, "economy"),
                passengers=Passengers(adults=adults), fetch_mode="fallback",
            )
    except Exception as e:
        return SourceResult("fast-flights", error=f"{type(e).__name__}: {str(e)[:100]}")

    res = SourceResult("fast-flights", price_signal=getattr(r, "current_price", None))
    for f in (getattr(r, "flights", []) or []):
        p = _price(getattr(f, "price", None))
        res.offers.append(Offer(
            source="fast-flights", airline=(getattr(f, "name", "") or "").strip(),
            price=p, currency="USD",
            duration=(getattr(f, "duration", "") or "").strip(),
            stops=_stops(getattr(f, "stops", None)),
            departure=(getattr(f, "departure", "") or "").strip(),
            arrival=(getattr(f, "arrival", "") or "").strip(),
        ))
    return res
