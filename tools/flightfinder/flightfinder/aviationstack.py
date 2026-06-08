"""Status de voo opcional via AviationStack (substitui o AeroDataBox).

Plano grátis sem cartão: https://aviationstack.com/signup/free  (cota mensal
limitada; NUNCA cadastre forma de pagamento, assim trava no limite em vez de
cobrar). Sem token, a checagem é pulada.

Uso: status de um voo específico (ex.: TP1234) sob demanda, não no fluxo de busca.
"""
from __future__ import annotations

import json
import os

from . import netutil


def token() -> str:
    return os.environ.get("AVIATIONSTACK_TOKEN", "").strip()


def status(flight_iata: str, flight_date: str | None = None) -> dict:
    tok = token()
    if not tok:
        return {"skipped": True, "reason": "sem token (defina AVIATIONSTACK_TOKEN)"}
    qs = f"access_key={tok}&flight_iata={flight_iata}"
    if flight_date:
        qs += f"&flight_date={flight_date}"
    # O plano grátis costuma liberar só HTTP; tentamos HTTPS e caímos para HTTP.
    for scheme in ("https", "http"):
        try:
            d = json.loads(netutil.fetch(f"{scheme}://api.aviationstack.com/v1/flights?{qs}",
                                         retries=1).decode("utf-8", "replace"))
        except Exception:
            continue
        if isinstance(d.get("error"), dict):
            return {"error": d["error"].get("message") or "erro AviationStack"}
        data = d.get("data") or []
        if not data:
            return {"error": "voo não encontrado"}
        f = data[0]
        dep, arr = f.get("departure") or {}, f.get("arrival") or {}
        return {
            "flight": (f.get("flight") or {}).get("iata") or flight_iata,
            "airline": (f.get("airline") or {}).get("name"),
            "status": f.get("flight_status"),
            "dep_airport": dep.get("airport"), "dep_terminal": dep.get("terminal"),
            "dep_gate": dep.get("gate"), "dep_scheduled": dep.get("scheduled"),
            "dep_delay_min": dep.get("delay"),
            "arr_airport": arr.get("airport"), "arr_terminal": arr.get("terminal"),
            "arr_scheduled": arr.get("scheduled"), "arr_delay_min": arr.get("delay"),
        }
    return {"error": "AviationStack inacessível"}


def render(s: dict) -> str:
    if s.get("skipped"):
        return f"Status de voo: inativo ({s['reason']})."
    if s.get("error"):
        return f"Status de voo: {s['error']}."
    delay = s.get("dep_delay_min")
    atraso = "no horário" if not delay else f"atraso de {delay} min na partida"
    return (f"Voo {s.get('flight')} ({s.get('airline') or 'companhia n/d'}): "
            f"{s.get('status') or 'status n/d'}, {atraso}. "
            f"Partida: {s.get('dep_airport') or '?'} "
            f"(terminal {s.get('dep_terminal') or 'n/d'}, portão {s.get('dep_gate') or 'n/d'}). "
            f"Chegada: {s.get('arr_airport') or '?'} "
            f"(terminal {s.get('arr_terminal') or 'n/d'}).")
