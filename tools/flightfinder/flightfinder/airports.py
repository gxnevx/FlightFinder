"""Resolução de aeroportos e alternativos próximos (dataset OpenFlights).

Mapeia cidade -> IATA, dá nome/país de um IATA (p/ checagem de visto) e sugere
aeroportos alternativos da mesma região metropolitana (ex.: São Paulo -> GRU,
CGH, VCP). Dataset: https://github.com/jpatokal/openflights (sem chave).
"""
from __future__ import annotations

import csv
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from . import netutil

AIRPORTS_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
CACHE = DATA_DIR / "airports.dat"

# Regiões metropolitanas com múltiplos aeroportos (alternativos úteis).
METRO = {
    "sao paulo": ["GRU", "CGH", "VCP"],
    "rio de janeiro": ["GIG", "SDU"],
    "belo horizonte": ["CNF", "PLU"],
    "london": ["LHR", "LGW", "STN", "LTN", "LCY", "SEN"],
    "paris": ["CDG", "ORY", "BVA"],
    "new york": ["JFK", "LGA", "EWR"],
    "milan": ["MXP", "LIN", "BGY"],
    "tokyo": ["HND", "NRT"],
    "buenos aires": ["EZE", "AEP"],
    "washington": ["IAD", "DCA", "BWI"],
    "chicago": ["ORD", "MDW"],
    "rome": ["FCO", "CIA"],
    "moscow": ["SVO", "DME", "VKO"],
    "istanbul": ["IST", "SAW"],
}


@dataclass
class Airport:
    iata: str
    name: str
    city: str
    country: str
    lat: float | None = None
    lon: float | None = None


def _strip(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).strip().lower()


def _ensure_dataset() -> Path:
    if not CACHE.exists() or CACHE.stat().st_size < 1000:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        CACHE.write_bytes(netutil.fetch(AIRPORTS_URL, timeout=40))
    return CACHE


@lru_cache(maxsize=1)
def _load() -> tuple[dict[str, Airport], dict[str, list[str]]]:
    by_iata: dict[str, Airport] = {}
    by_city: dict[str, list[str]] = {}
    try:
        path = _ensure_dataset()
    except Exception:
        return {}, {}
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.reader(fh):
            if len(row) < 8:
                continue
            iata = row[4].strip()
            if not iata or iata == "\\N" or len(iata) != 3:
                continue
            try:
                lat, lon = float(row[6]), float(row[7])
            except ValueError:
                lat = lon = None
            ap = Airport(iata.upper(), row[1], row[2], row[3], lat, lon)
            by_iata[ap.iata] = ap
            by_city.setdefault(_strip(ap.city), []).append(ap.iata)
    return by_iata, by_city


def get(iata: str) -> Airport | None:
    return _load()[0].get((iata or "").upper())


def country_of(iata: str) -> str | None:
    ap = get(iata)
    return ap.country if ap else None


def resolve(query: str) -> list[Airport]:
    """Aceita IATA (3 letras) ou nome de cidade/aeroporto. Retorna candidatos."""
    by_iata, by_city = _load()
    q = (query or "").strip()
    if len(q) == 3 and q.upper() in by_iata:
        return [by_iata[q.upper()]]
    qn = _strip(q)
    hits: list[Airport] = []
    # cidade exata
    for code in by_city.get(qn, []):
        hits.append(by_iata[code])
    # contém no nome da cidade ou do aeroporto
    if not hits:
        for ap in by_iata.values():
            if qn and (qn in _strip(ap.city) or qn in _strip(ap.name)):
                hits.append(ap)
                if len(hits) >= 8:
                    break
    return hits


def alternatives(iata: str) -> list[str]:
    """Aeroportos alternativos da mesma região metropolitana/cidade."""
    iata = (iata or "").upper()
    by_iata, by_city = _load()
    out: list[str] = []
    # mapa metropolitano curado
    for codes in METRO.values():
        if iata in codes:
            out = [c for c in codes if c != iata and c in by_iata]
            break
    # mesma cidade (complementa)
    ap = by_iata.get(iata)
    if ap:
        for c in by_city.get(_strip(ap.city), []):
            if c != iata and c not in out:
                out.append(c)
    return out
