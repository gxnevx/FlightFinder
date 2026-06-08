"""Fonte: LetsFG (200+ conectores, 400+ companhias). CLI `letsfg search --json`.

Busca grátis e sem chave. Ignoramos ofertas de teste (id começando com off_tst_)
e só contamos preços em USD para o consenso (a fonte às vezes devolve moedas de
sandbox).
"""
from __future__ import annotations

import json
import shutil
import subprocess

from ..model import Offer, SourceResult


def _dur(seconds) -> str:
    try:
        s = int(seconds)
    except (TypeError, ValueError):
        return ""
    return f"{s // 3600}h {s % 3600 // 60:02d}min"


def search(origin, dest, date_from, return_from=None, adults=1, cabin=None) -> SourceResult:
    if not shutil.which("letsfg"):
        return SourceResult("LetsFG", error="CLI letsfg ausente")
    cmd = ["letsfg", "search", origin, dest, date_from, "--json", "--mode", "fast"]
    if return_from:
        cmd += ["--return", return_from]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=150)
    except Exception as e:
        return SourceResult("LetsFG", error=f"{type(e).__name__}")
    if not out.stdout.strip():
        return SourceResult("LetsFG", error=(out.stderr or "sem saída").strip()[:120])
    try:
        data = json.loads(out.stdout)
    except json.JSONDecodeError:
        return SourceResult("LetsFG", error="JSON inválido")

    res = SourceResult("LetsFG")
    for o in (data.get("offers") or []):
        if str(o.get("id", "")).startswith("off_tst_"):
            continue
        cur = (o.get("currency") or "USD").upper()
        price = o.get("price")
        airlines = o.get("airlines") or []
        res.offers.append(Offer(
            source="LetsFG",
            airline=", ".join(map(str, airlines)) if airlines else (o.get("owner_airline") or ""),
            price=float(price) if price is not None else None, currency=cur,
            duration=_dur(o.get("duration_seconds")), stops=o.get("stopovers"),
        ))
    return res
