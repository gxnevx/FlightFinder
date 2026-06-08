"""Modo consenso: cruza as fontes, reconcilia preços (em BRL) e dá confiança.

Para cada fonte pegamos a tarifa mais barata comparável (já em BRL), calculamos
a faixa (mín/mediana/máx) e a dispersão. Sinalizamos divergência quando a
dispersão passa de um limiar (padrão 15%).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from statistics import median

from .model import Offer, SourceResult

DIVERGENCE_THRESHOLD = 0.15


@dataclass
class Consensus:
    sources_used: list[str] = field(default_factory=list)
    sources_failed: list[str] = field(default_factory=list)
    cheapest_offer: Offer | None = None
    min_brl: float | None = None
    median_brl: float | None = None
    max_brl: float | None = None
    spread_pct: float | None = None
    confidence: str = "indisponível"
    price_signal: str | None = None
    divergent: bool = False
    notes: list[str] = field(default_factory=list)


def _signal_pt(sig: str | None) -> str | None:
    return {"low": "barata", "typical": "típica", "high": "cara"}.get(sig or "")


def build(results: list[SourceResult], threshold: float = DIVERGENCE_THRESHOLD) -> Consensus:
    c = Consensus()
    per_source: list[float] = []
    all_priced: list[Offer] = []

    for r in results:
        if r.error:
            c.sources_failed.append(f"{r.name} ({r.error})")
            continue
        if r.price_signal and not c.price_signal:
            c.price_signal = r.price_signal
        cheap = r.cheapest_brl()
        if cheap is None:
            # fonte respondeu mas nada pôde ser convertido para BRL
            c.sources_failed.append(f"{r.name} (sem preço convertível)")
            continue
        c.sources_used.append(r.name)
        per_source.append(cheap.price_brl)
        all_priced.extend(r.priced())

    # melhor opção: a mais barata que tenha companhia identificada (mais útil);
    # se nenhuma tiver, cai para a mais barata no geral.
    named = [o for o in all_priced if (o.airline or "").strip()]
    pool = named or all_priced
    if pool:
        c.cheapest_offer = min(pool, key=lambda o: o.price_brl)

    n = len(per_source)
    if n:
        c.min_brl, c.max_brl = min(per_source), max(per_source)
        c.median_brl = median(per_source)
        if c.min_brl > 0:
            c.spread_pct = (c.max_brl - c.min_brl) / c.min_brl
    c.divergent = c.spread_pct is not None and c.spread_pct > threshold

    if n >= 2 and not c.divergent:
        c.confidence = "alta"
    elif n >= 2 and c.spread_pct is not None and c.spread_pct <= 0.30:
        c.confidence = "média"
    elif n >= 2:
        c.confidence = "baixa"
    elif n == 1:
        c.confidence = "baixa"
    else:
        c.confidence = "indisponível"

    sig = _signal_pt(c.price_signal)
    if sig:
        c.notes.append(f"Para esta rota e data, a tarifa está {sig} (sinal fast-flights).")
    if c.divergent:
        c.notes.append(
            f"Fontes divergem {c.spread_pct * 100:.0f}% (acima de {threshold * 100:.0f}%): "
            "pode haver combos de autoconexão (bilhetes separados); confira as condições."
        )
    return c
