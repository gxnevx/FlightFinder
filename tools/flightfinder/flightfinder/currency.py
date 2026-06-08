"""Conversão de moedas estrangeiras para BRL (custo final em reais).

As fontes devolvem preços em moedas diferentes (USD no fast-flights, EUR/USD no
LetsFG, etc.), então convertemos cada uma para BRL.

Cadeia de fontes de câmbio (todas grátis, sem cartão):
  1. AwesomeAPI  https://docs.awesomeapi.com.br/api-de-moedas
       USD-BRLT (turismo), USD-BRLPTAX (PTAX/benchmark) e {MOEDA}-BRL.
       Tier grátis tem cota por IP; um token grátis opcional (AWESOMEAPI_TOKEN,
       sem cartão) eleva a cota.
  2. Frankfurter (dados do BCE) https://www.frankfurter.app  multi-moeda, sem chave.
  3. dolarhoje (jaswdr/dolarhoje) via ./bin/dolar  fallback só de USD.

Ao custo somamos o IOF de compra internacional (IOF_PCT, padrão configurável),
senão a conversão fica otimista. Se nenhuma fonte cobrir uma moeda, as ofertas
naquela moeda saem do consenso (sem quebrar a busca).
"""
from __future__ import annotations

import os
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

from . import netutil

AWESOME = "https://economia.awesomeapi.com.br/json"
FRANKFURTER = "https://api.frankfurter.app/latest"
DEFAULT_IOF_PCT = 3.5  # estimativa p/ compra internacional; ajuste via IOF_PCT


def _iof_pct() -> float:
    try:
        return float(os.environ.get("IOF_PCT", DEFAULT_IOF_PCT))
    except ValueError:
        return DEFAULT_IOF_PCT


def _token_suffix() -> str:
    tok = os.environ.get("AWESOMEAPI_TOKEN", "").strip()
    return f"?token={tok}" if tok else ""


def _num(v) -> float | None:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


@dataclass
class Rate:
    base: dict[str, float] = field(default_factory=dict)  # MOEDA -> R$ por unidade (sem IOF)
    ptax_usd: float | None = None
    iof_pct: float = field(default_factory=_iof_pct)
    source: str = "indisponível"
    trend_pct_30d: float | None = None
    warnings: list[str] = field(default_factory=list)

    def base_of(self, cur: str) -> float | None:
        return self.base.get((cur or "USD").upper())

    def effective_of(self, cur: str) -> float | None:
        b = self.base_of(cur)
        return None if b is None else b * (1 + self.iof_pct / 100.0)

    def to_brl(self, amount: float | None, cur: str = "USD") -> float | None:
        e = self.effective_of(cur)
        return None if (e is None or amount is None) else amount * e

    def trend_note(self) -> str:
        if self.trend_pct_30d is None:
            return ""
        p = self.trend_pct_30d
        if p > 1.5:
            return f"dólar em alta ({p:+.1f}% em 30 dias)"
        if p < -1.5:
            return f"dólar em queda ({p:+.1f}% em 30 dias)"
        return f"dólar estável ({p:+.1f}% em 30 dias)"


def _from_awesomeapi(rate: Rate, currencies: set[str]) -> None:
    pairs = ["USD-BRLT", "USD-BRLPTAX"] + [f"{c}-BRL" for c in sorted(currencies) if c != "USD"]
    try:
        d = netutil.fetch_json(f"{AWESOME}/last/{','.join(pairs)}{_token_suffix()}", retries=1)
    except Exception as e:
        rate.warnings.append(f"AwesomeAPI indisponível ({type(e).__name__})")
        return

    def grab(key: str) -> float | None:
        v = d.get(key)
        return (_num(v.get("ask")) or _num(v.get("bid"))) if isinstance(v, dict) else None

    usd_t = grab("USDBRLT")
    if usd_t:
        rate.base["USD"] = usd_t
    rate.ptax_usd = grab("USDBRLPTAX")
    for c in currencies:
        if c == "USD":
            continue
        v = grab(f"{c}BRL")
        if v:
            rate.base[c] = v
    if rate.base:
        rate.source = "AwesomeAPI (turismo + PTAX)" if rate.ptax_usd else "AwesomeAPI"


def _awesome_trend(rate: Rate) -> None:
    try:
        hist = netutil.fetch_json(f"{AWESOME}/daily/USD-BRL/30{_token_suffix()}", retries=0)
        if isinstance(hist, list) and len(hist) >= 2:
            newest, oldest = _num(hist[0].get("bid")), _num(hist[-1].get("bid"))
            if newest and oldest:
                rate.trend_pct_30d = (newest - oldest) / oldest * 100.0
    except Exception:
        pass


def _from_frankfurter(rate: Rate, currencies: set[str]) -> None:
    used = False
    for c in currencies:
        if c in rate.base:
            continue
        try:
            d = netutil.fetch_json(f"{FRANKFURTER}?from={c}&to=BRL", retries=1)
            v = _num((d.get("rates") or {}).get("BRL"))
            if v:
                rate.base[c] = v
                used = True
        except Exception:
            pass
    if used and "AwesomeAPI" not in rate.source:
        rate.source = "Frankfurter (BCE)"
    elif used:
        rate.source += " + Frankfurter"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _from_dolarhoje_usd(rate: Rate) -> None:
    if "USD" in rate.base:
        return
    dolar = _repo_root() / "bin" / "dolar"
    if dolar.exists():
        try:
            out = subprocess.run([str(dolar)], capture_output=True, text=True, timeout=90)
            v = _num(out.stdout.strip())
            if v:
                rate.base["USD"] = v
                rate.source = "dolarhoje (fallback)" if rate.source == "indisponível" else rate.source
                return
        except Exception:
            pass
    try:
        html = netutil.fetch_text("https://dolarhoje.com/", retries=1)
        m = re.search(r"R\$\s*([0-9]{1,3},[0-9]{2})", html)
        if m:
            rate.base["USD"] = float(m.group(1).replace(",", "."))
            if rate.source == "indisponível":
                rate.source = "dolarhoje.com (fallback)"
    except Exception as e:
        rate.warnings.append(f"dolarhoje indisponível ({type(e).__name__})")


def get_rate(currencies: set[str] | None = None) -> Rate:
    """Cotações para as moedas pedidas (USD sempre incluída), degradando gracioso."""
    rate = Rate()
    cset = {(c or "USD").upper() for c in (currencies or set())} | {"USD"}
    _from_awesomeapi(rate, cset)
    _awesome_trend(rate)
    _from_frankfurter(rate, cset)        # cobre moedas que faltaram (ex.: EUR)
    _from_dolarhoje_usd(rate)            # último recurso só p/ USD
    if not rate.base:
        rate.warnings.append("nenhuma fonte de câmbio disponível")
    return rate
