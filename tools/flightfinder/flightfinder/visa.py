"""Checagem de visto para passaporte brasileiro (dataset passport-index).

https://github.com/ilyankou/passport-index-dataset (sem chave). Para todo destino
internacional sinalizamos se exige visto/eTA antes de animar com a passagem.
"""
from __future__ import annotations

import csv
import unicodedata
from functools import lru_cache
from pathlib import Path

from . import netutil

URL = "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy.csv"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
CACHE = DATA_DIR / "passport-index-tidy.csv"

# Nome no OpenFlights -> nome no passport-index, quando divergem.
ALIASES = {
    "czech republic": "czechia",
    "cape verde": "cabo verde",
    "macau": "macao",
    "burma": "myanmar",
    "ivory coast": "cote d ivoire",
    "south korea": "south korea",
    "north korea": "north korea",
    "russia": "russia",
    "swaziland": "eswatini",
    "east timor": "timor leste",
    "congo (kinshasa)": "dr congo",
    "congo (brazzaville)": "congo",
}


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(ch if ch.isalnum() else " " for ch in s.lower()).strip()


def _pt(req: str) -> tuple[str, bool | None]:
    """Traduz o requisito e diz se exige visto (True/False/None=desconhecido)."""
    r = (req or "").strip().lower()
    if r.isdigit():
        return f"sem visto (livre por até {r} dias)", False
    table = {
        "visa free": ("sem visto", False),
        "visa on arrival": ("visto na chegada", False),
        "e-visa": ("visto eletrônico (e-visa) exigido", True),
        "evisa": ("visto eletrônico (e-visa) exigido", True),
        "eta": ("autorização eletrônica (eTA) exigida", True),
        "e-ta": ("autorização eletrônica (eTA) exigida", True),
        "visa required": ("exige visto", True),
        "no admission": ("entrada não permitida", True),
        "covid ban": ("restrição sanitária vigente", True),
    }
    return table.get(r, (f"verifique manualmente ({req})", None))


def _ensure() -> Path:
    if not CACHE.exists() or CACHE.stat().st_size < 1000:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        CACHE.write_bytes(netutil.fetch(URL, timeout=40))
    return CACHE


@lru_cache(maxsize=1)
def _load(passport: str = "Brazil") -> dict[str, str]:
    try:
        path = _ensure()
    except Exception:
        return {}
    out: dict[str, str] = {}
    pn = _norm(passport)
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if _norm(row.get("Passport", "")) == pn:
                out[_norm(row.get("Destination", ""))] = row.get("Requirement", "")
    return out


def check(dest_country: str, passport: str = "Brazil") -> dict:
    """Retorna {country, requirement_raw, message, needs_visa}."""
    table = _load(passport)
    key = _norm(dest_country)
    key = _norm(ALIASES.get(key, key))
    raw = table.get(key)
    if raw is None:
        # fallback: tenta correspondência por prefixo
        for k, v in table.items():
            if k and (k.startswith(key) or key.startswith(k)):
                raw = v
                break
    if raw is None:
        return {"country": dest_country, "requirement_raw": None,
                "message": "não foi possível determinar (verifique manualmente)",
                "needs_visa": None}
    msg, needs = _pt(raw)
    return {"country": dest_country, "requirement_raw": raw, "message": msg, "needs_visa": needs}
