"""Estruturas normalizadas compartilhadas pelas fontes e pelo consenso."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Offer:
    source: str
    airline: str = ""
    price: float | None = None        # valor na moeda original
    currency: str = "USD"
    price_brl: float | None = None     # preenchido pela conversão (com IOF)
    duration: str = ""
    stops: int | None = None
    departure: str = ""
    arrival: str = ""


@dataclass
class SourceResult:
    name: str
    offers: list[Offer] = field(default_factory=list)
    price_signal: str | None = None    # low/typical/high (fast-flights)
    error: str | None = None

    def priced(self) -> list[Offer]:
        return [o for o in self.offers if o.price_brl is not None]

    def cheapest_brl(self) -> Offer | None:
        p = self.priced()
        return min(p, key=lambda o: o.price_brl) if p else None
