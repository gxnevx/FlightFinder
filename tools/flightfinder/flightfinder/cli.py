"""CLI do FlightFinder: modo consenso multi-fonte, saída em PT-BR e BRL.

Uso:
  flightfinder GRU LIS 2026-09-10 --return 2026-09-24 [--adults 1] [--cabin economy]
               [--gf-usd 1159]   # injeta o preço do google-flights (agent-browser)
               [--json]

Núcleo grátis (Fase 1): fast-flights + LetsFG, câmbio AwesomeAPI/dolarhoje,
aeroportos OpenFlights, visto (passport-index), clima (Open-Meteo). Tudo modular:
se uma fonte falhar, a busca continua e o nível de confiança reflete isso.
"""
from __future__ import annotations

import argparse
import dataclasses
import json
import sys

from . import airports, aviationstack, consensus, currency, visa, weather
from .model import Offer, SourceResult
from .sources import fastflights_src, letsfg_src, travelpayouts_src


def fmt_brl(v: float | None) -> str:
    if v is None:
        return "indisponível"
    s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def fmt_usd(v: float | None) -> str:
    if v is None:
        return "?"
    return f"US$ {v:,.0f}".replace(",", ".")


def fmt_stops(n: int | None) -> str:
    if n is None:
        return "paradas n/d"
    if n == 0:
        return "direto"
    return f"{n} parada" + ("s" if n > 1 else "")


def _resolve(query: str) -> tuple[str, list[str], str | None]:
    """Retorna (iata_principal, alternativos, nome_pais)."""
    cands = airports.resolve(query)
    if not cands:
        return query.upper(), [], None
    primary = cands[0]
    alts = airports.alternatives(primary.iata)
    return primary.iata, alts, primary.country


def run(args) -> dict:
    origin, o_alts, _ = _resolve(args.origin)
    dest, d_alts, dest_country = _resolve(args.dest)

    results: list[SourceResult] = [
        fastflights_src.search(origin, dest, args.date, args.return_date, args.adults, args.cabin),
        letsfg_src.search(origin, dest, args.date, args.return_date, args.adults, args.cabin),
    ]
    if args.gf_usd is not None:
        results.append(SourceResult("google-flights", offers=[Offer(
            source="google-flights", airline="(consolidado google-flights)",
            price=args.gf_usd, currency="USD")]))
    if travelpayouts_src.token():  # 3a fonte opcional (cache), só com token
        results.append(travelpayouts_src.search(origin, dest, args.date, args.return_date))

    currencies = {o.currency for r in results for o in r.offers if o.price is not None}
    rate = currency.get_rate(currencies)
    for r in results:
        for o in r.offers:
            o.price_brl = rate.to_brl(o.price, o.currency)

    con = consensus.build(results, threshold=args.threshold)

    rate_dict = {
        "source": rate.source,
        "iof_pct": rate.iof_pct,
        "ptax_usd": rate.ptax_usd,
        "trend_pct_30d": rate.trend_pct_30d,
        "trend_note": rate.trend_note(),
        "usd_base": rate.base_of("USD"),
        "usd_effective": rate.effective_of("USD"),
        "currencies": {c: {"base": rate.base_of(c), "effective": rate.effective_of(c)}
                       for c in sorted(rate.base)},
        "warnings": rate.warnings,
    }

    visa_info = None
    if dest_country and dest_country.strip().lower() != "brazil":
        visa_info = visa.check(dest_country, passport=args.passport)

    weather_info = None
    if not args.no_weather:
        dap = airports.get(dest)
        city = dap.city if dap else args.dest
        weather_info = weather.summary(city, args.date, args.return_date)

    cheap_dates = None
    if travelpayouts_src.token():
        cheap_dates = travelpayouts_src.cheapest_dates(origin, dest, args.date[:7])

    return {
        "query": {"origin": origin, "dest": dest, "date": args.date,
                  "return": args.return_date, "adults": args.adults, "cabin": args.cabin,
                  "dest_country": dest_country},
        "alternatives": {"origin": o_alts, "dest": d_alts},
        "rate": rate_dict,
        "consensus": dataclasses.asdict(con),
        "visa": visa_info,
        "weather": weather_info,
        "cheap_dates": cheap_dates,
    }


def render(data: dict) -> str:
    q = data["query"]
    con = data["consensus"]
    rate = data["rate"]
    out: list[str] = []

    trip = (f"ida {q['date']}" + (f", volta {q['return']}" if q["return"] else ", só ida"))
    out.append(f"Voos {q['origin']} para {q['dest']} ({trip}, {q['adults']} adulto(s), {q['cabin']})")
    out.append("")

    ch = con.get("cheapest_offer")
    if ch and ch.get("price_brl") is not None:
        out.append(f"Melhor opção: {ch['airline'] or ch['source']}, "
                   f"{fmt_stops(ch['stops'])}" + (f", {ch['duration']}" if ch['duration'] else ""))
        usd = f" ({fmt_usd(ch['price_usd'])})" if ch.get("price_usd") else ""
        out.append(f"  Preço: {fmt_brl(ch['price_brl'])}{usd}  ·  fonte: {ch['source']}")
        out.append("")

    out.append("Consenso de preço (em BRL, já com IOF):")
    out.append(f"  Mais barato: {fmt_brl(con['min_brl'])}  ·  mediana: {fmt_brl(con['median_brl'])}"
               f"  ·  mais caro: {fmt_brl(con['max_brl'])}")
    used = con["sources_used"]
    out.append(f"  Fontes consultadas: {', '.join(used) if used else 'nenhuma'} ({len(used)})")
    if con["spread_pct"] is not None:
        flag = "divergência" if con["divergent"] else "ok"
        out.append(f"  Dispersão entre fontes: {con['spread_pct'] * 100:.0f}% ({flag})")
    sig = {"low": "barata", "typical": "típica", "high": "cara"}.get(con.get("price_signal") or "")
    if sig:
        out.append(f"  Classificação da tarifa: {sig}")
    out.append(f"  Nível de confiança: {con['confidence']}")
    if con["sources_failed"]:
        out.append(f"  Fontes indisponíveis: {', '.join(con['sources_failed'])}")
    out.append("")

    usd_base = rate.get("usd_base")
    if usd_base:
        iof = f"{rate['iof_pct']:.2f}".replace(".", ",")
        bits = [f"USD base {fmt_brl(usd_base)}"]
        if rate.get("ptax_usd"):
            bits.append(f"PTAX {fmt_brl(rate['ptax_usd'])}")
        out.append("Câmbio (USD): " + " · ".join(bits)
                   + f" · +IOF {iof}% = {fmt_brl(rate.get('usd_effective'))} efetivo")
        for c in (rate.get("currencies") or {}):
            if c == "USD":
                continue
            info = rate["currencies"][c]
            if info.get("base"):
                out.append(f"  {c}: base {fmt_brl(info['base'])} "
                           f"(efetivo c/ IOF {fmt_brl(info['effective'])})")
        if rate.get("trend_note"):
            out.append(f"  Tendência: {rate['trend_note']}")
        out.append(f"  Fonte: {rate.get('source')}")

    v = data.get("visa")
    if v:
        prefix = "ATENÇÃO " if v.get("needs_visa") else ""
        out.append("")
        out.append(f"{prefix}Visto (passaporte brasileiro) para {v['country']}: {v['message']}")

    w = data.get("weather")
    if w:
        out.append("")
        out.append(f"Clima no destino: {w}")

    cd = data.get("cheap_dates")
    if cd:
        out.append("")
        out.append(f"Datas mais baratas no mês (Travelpayouts, cache): "
                   f"{cd['date']}, a partir de {cd['currency']} {cd['price']:.0f}")

    alt = data["alternatives"]
    if alt["origin"] or alt["dest"]:
        out.append("")
        out.append("Aeroportos alternativos: "
                   f"origem ({', '.join(alt['origin']) or 'nenhum'}), "
                   f"destino ({', '.join(alt['dest']) or 'nenhum'})")

    notes = con.get("notes") or []
    if notes:
        out.append("")
        out.append("Observações:")
        for note in notes:
            out.append(f"  - {note}")

    if rate.get("warnings"):
        out.append("")
        out.append("Avisos: " + "; ".join(rate["warnings"]))
    return "\n".join(out)


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)

    # Subcomando opcional: status de voo (AviationStack), sob demanda.
    if argv and argv[0] == "status":
        sp = argparse.ArgumentParser(prog="flightfinder status",
                                     description="Status de um voo (ex.: TP1234).")
        sp.add_argument("flight", help="código IATA do voo, ex.: TP1234")
        sp.add_argument("date", nargs="?", default=None, help="data YYYY-MM-DD (opcional)")
        a = sp.parse_args(argv[1:])
        print(aviationstack.render(aviationstack.status(a.flight, a.date)))
        return 0

    p = argparse.ArgumentParser(prog="flightfinder", description="Busca de voos multi-fonte (modo consenso, BR/BRL).")
    p.add_argument("origin", help="origem (IATA ou cidade)")
    p.add_argument("dest", help="destino (IATA ou cidade)")
    p.add_argument("date", help="data de ida YYYY-MM-DD")
    p.add_argument("--return", dest="return_date", default=None, help="data de volta YYYY-MM-DD")
    p.add_argument("--adults", type=int, default=1)
    p.add_argument("--cabin", default="economy", choices=["economy", "premium", "business", "first"])
    p.add_argument("--passport", default="Brazil", help="país do passaporte (padrão Brazil)")
    p.add_argument("--gf-usd", type=float, default=None,
                   help="preço mais barato do google-flights em USD (injetado pelo agente)")
    p.add_argument("--threshold", type=float, default=consensus.DIVERGENCE_THRESHOLD,
                   help="limiar de divergência (padrão 0.15)")
    p.add_argument("--no-weather", action="store_true")
    p.add_argument("--json", action="store_true", help="saída JSON crua")
    args = p.parse_args(argv)

    data = run(args)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(render(data))
    return 0


if __name__ == "__main__":
    sys.exit(main())
