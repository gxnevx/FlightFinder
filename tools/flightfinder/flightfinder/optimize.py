"""Otimizador de viagem: trata a busca como problema de otimização.

Gera candidatos por estratégia (datas flexíveis, aeroportos alternativos, combos
de interlining via LetsFG), calcula o custo total real em BRL (tarifa + IOF +
transfer estimado de aeroporto alternativo), aplica penalidade de risco/atrito e
devolve um ranking com a melhor opção "sem pegadinha" e a melhor "agressiva".

Tudo grátis. As buscas de candidatos rodam concorrentes para não ficar lento.
"""
from __future__ import annotations

import concurrent.futures as cf
import datetime as dt
import os
from dataclasses import dataclass, field

from . import airports, currency
from .sources import fastflights_src, letsfg_src

# Estimativa de transfer até a cidade quando se usa aeroporto alternativo
# (não há API grátis confiável de custo terrestre; valor configurável).
GROUND_TRANSFER_BRL = float(os.environ.get("GROUND_TRANSFER_BRL", "60") or 60)
MAX_FF_CANDIDATES = 12  # teto de buscas fast-flights (datas + aeroportos)
SHORT_INTL_LAYOVER_MIN = 90


@dataclass
class Cand:
    strategy: str
    origin: str
    dest: str
    date: str
    return_date: str | None
    source: str = "fast-flights"
    price: float | None = None
    currency: str = "USD"
    price_brl: float | None = None
    airline: str = ""
    stops: int | None = None
    duration: str = ""
    signal: str | None = None
    extra_brl: float = 0.0
    caveats: list[str] = field(default_factory=list)
    clean: bool = True

    @property
    def total_brl(self) -> float | None:
        return None if self.price_brl is None else self.price_brl + self.extra_brl

    def risk(self) -> float:
        pen = 0.04 * (self.stops or 0)
        pen += 0.12 * len(self.caveats)
        return pen

    @property
    def score(self) -> float | None:
        t = self.total_brl
        return None if t is None else t * (1 + self.risk())


def _date(s: str) -> dt.date:
    return dt.date.fromisoformat(s)


def _shift(s: str, days: int) -> str:
    return (_date(s) + dt.timedelta(days=days)).isoformat()


def _ff_candidate(strategy, origin, dest, date, rdate, clean, caveats, extra, cabin) -> Cand:
    r = fastflights_src.search(origin, dest, date, rdate, cabin=cabin)
    c = Cand(strategy=strategy, origin=origin, dest=dest, date=date, return_date=rdate,
             source="fast-flights", signal=r.price_signal, clean=clean,
             caveats=list(caveats), extra_brl=extra)
    cheap = min((o for o in r.offers if o.price is not None), key=lambda o: o.price, default=None)
    if cheap:
        c.price, c.currency, c.airline = cheap.price, cheap.currency, cheap.airline
        c.stops, c.duration = cheap.stops, cheap.duration
        if c.stops and c.stops >= 2:
            c.clean = False
            c.caveats.append(f"{c.stops} conexões")
    return c


def _letsfg_candidate(origin, dest, date, rdate) -> Cand | None:
    r = letsfg_src.search(origin, dest, date, rdate)
    cheap = min((o for o in r.offers if o.price is not None), key=lambda o: o.price, default=None)
    if not cheap:
        return None
    return Cand(strategy="combo de interlining (LetsFG)", origin=origin, dest=dest,
                date=date, return_date=rdate, source="LetsFG", price=cheap.price,
                currency=cheap.currency, airline=cheap.airline, stops=cheap.stops,
                duration=cheap.duration, clean=False,
                caveats=["bilhetes separados, sem proteção entre os contratos "
                         "(atraso no primeiro pode perder o segundo)"])


def _date_grid(args) -> list[tuple[str, str | None]]:
    """Lista de (ida, volta) a testar conforme janela/duração pedidas."""
    pairs: list[tuple[str, str | None]] = []
    if args.depart_from and args.depart_to:
        d0, d1 = _date(args.depart_from), _date(args.depart_to)
        nights = _parse_nights(args.nights)
        d = d0
        while d <= d1:
            for n in nights:
                rd = (d + dt.timedelta(days=n)).isoformat() if (args.return_date or nights != [0]) else None
                pairs.append((d.isoformat(), rd))
            d += dt.timedelta(days=1)
    else:
        w = max(0, args.window)
        for off in range(-w, w + 1):
            rd = _shift(args.return_date, off) if args.return_date else None
            pairs.append((_shift(args.date, off), rd))
    # amostra uniforme se passar do teto
    if len(pairs) > MAX_FF_CANDIDATES:
        step = len(pairs) / MAX_FF_CANDIDATES
        pairs = [pairs[int(i * step)] for i in range(MAX_FF_CANDIDATES)]
    return pairs


def _parse_nights(spec: str | None) -> list[int]:
    if not spec:
        return [0]
    if "-" in spec:
        a, b = spec.split("-", 1)
        return list(range(int(a), int(b) + 1))
    return [int(spec)]


def generate(args) -> tuple[str, str, list[Cand]]:
    origin = airports.resolve(args.origin)[0].iata if airports.resolve(args.origin) else args.origin.upper()
    dest = airports.resolve(args.dest)[0].iata if airports.resolve(args.dest) else args.dest.upper()

    base_date = args.date or (args.depart_from or "")
    base_rd = args.return_date
    if not base_rd and args.depart_from and args.nights:
        base_rd = _shift(base_date, _parse_nights(args.nights)[0])

    jobs: list = []  # (callable, ...)
    # 1) datas flexíveis (aeroportos base)
    for d, rd in _date_grid(args):
        clean = (d == base_date)
        cav = [] if clean else [f"data alternativa ({d}" + (f" a {rd}" if rd else "") + ")"]
        jobs.append(("ff", "datas flexíveis" if not clean else "voo direto (base)",
                     origin, dest, d, rd, clean, cav, 0.0))
    # 2) aeroportos alternativos (datas base)
    for alt in airports.alternatives(origin)[:2]:
        jobs.append(("ff", f"origem alternativa {alt}", alt, dest, base_date, base_rd,
                     False, [f"sair de {alt} (some transfer ~R$ {GROUND_TRANSFER_BRL:.0f})"],
                     GROUND_TRANSFER_BRL))
    for alt in airports.alternatives(dest)[:2]:
        jobs.append(("ff", f"destino alternativo {alt}", origin, alt, base_date, base_rd,
                     False, [f"chegar em {alt} (some transfer ~R$ {GROUND_TRANSFER_BRL:.0f})"],
                     GROUND_TRANSFER_BRL))

    cands: list[Cand] = []
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(_ff_candidate, s, o, dst, d, rd, cl, cav, ex_brl, args.cabin)
                for (_, s, o, dst, d, rd, cl, cav, ex_brl) in jobs]
        # 3) combo agressivo (LetsFG) na rota/datas base, em paralelo
        lf = ex.submit(_letsfg_candidate, origin, dest, base_date, base_rd)
        for f in cf.as_completed(futs):
            try:
                cands.append(f.result())
            except Exception:
                pass
        try:
            lc = lf.result()
            if lc:
                cands.append(lc)
        except Exception:
            pass

    # converte tudo para BRL
    currencies = {c.currency for c in cands if c.price is not None}
    rate = currency.get_rate(currencies)
    for c in cands:
        c.price_brl = rate.to_brl(c.price, c.currency)
    cands = [c for c in cands if c.total_brl is not None]
    return origin, dest, _attach_rate(cands, rate)


def _attach_rate(cands, rate):
    for c in cands:
        c._rate = rate  # type: ignore[attr-defined]
    return cands
