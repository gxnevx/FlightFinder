"""Previsão/clima no destino nas datas do voo, via Open-Meteo (sem chave).

Datas a até ~14 dias usam previsão; datas distantes usam a média histórica do
mesmo período no ano anterior (rotulada como estimativa sazonal).
https://open-meteo.com
"""
from __future__ import annotations

import datetime as dt

from . import netutil

GEO = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST = "https://api.open-meteo.com/v1/forecast"
ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
DAILY = "temperature_2m_max,temperature_2m_min,precipitation_sum"


def _geocode(city: str) -> tuple[float, float, str] | None:
    try:
        d = netutil.fetch_json(f"{GEO}?name={city.replace(' ', '+')}&count=1&language=pt", retries=1)
        res = (d.get("results") or [])
        if res:
            r = res[0]
            return float(r["latitude"]), float(r["longitude"]), r.get("name", city)
    except Exception:
        pass
    return None


def _avg(xs):
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else None


def summary(city: str, start_date: str, end_date: str | None = None) -> str | None:
    geo = _geocode(city)
    if not geo:
        return None
    lat, lon, name = geo
    end_date = end_date or start_date
    today = dt.date.today()
    try:
        start = dt.date.fromisoformat(start_date)
    except ValueError:
        return None
    ahead = (start - today).days

    if 0 <= ahead <= 14:
        url = (f"{FORECAST}?latitude={lat}&longitude={lon}&daily={DAILY}"
               f"&timezone=auto&start_date={start_date}&end_date={end_date}")
        label = "previsão"
    else:
        def prev(d):
            return (dt.date.fromisoformat(d).replace(year=dt.date.fromisoformat(d).year - 1)).isoformat()
        url = (f"{ARCHIVE}?latitude={lat}&longitude={lon}&daily={DAILY}"
               f"&timezone=auto&start_date={prev(start_date)}&end_date={prev(end_date)}")
        label = "média histórica (mesmo período do ano passado)"

    try:
        d = netutil.fetch_json(url, retries=1)
        daily = d.get("daily") or {}
        tmax = _avg(daily.get("temperature_2m_max") or [])
        tmin = _avg(daily.get("temperature_2m_min") or [])
        prec = daily.get("precipitation_sum") or []
        rain_days = sum(1 for p in prec if p and p > 1.0)
        if tmax is None:
            return None
        chuva = ("sem chuva relevante" if rain_days == 0
                 else f"{rain_days} dia(s) com chuva")
        return f"{name} ({label}): máx ~{tmax:.0f}°C, mín ~{tmin:.0f}°C, {chuva}"
    except Exception:
        return None
