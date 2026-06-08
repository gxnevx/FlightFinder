# ✈️ FlightFinder

Agente de **busca de voos multi-fonte com modo consenso**, localizado para o
Brasil (respostas em português, valores em BRL, ida e volta por padrão).

Cruza várias fontes gratuitas, reconcilia os preços em reais (com IOF), classifica
a tarifa (barata/típica/cara) e devolve a melhor opção com **nível de confiança**,
checagem de **visto** para passaporte brasileiro e **clima** no destino.

## Peça coisas como

- "Acha voos de GRU para Lisboa, ida 10/09 e volta 24/09"
- "Quanto custa um voo de São Paulo para Buenos Aires em outubro?"
- "Mais barato de GRU para Madri, ida e volta na primeira semana de setembro"

## Como funciona

```bash
./bin/flightfinder GRU LIS 2026-09-10 --return 2026-09-24 [--gf-usd 1167] [--json]
```

Núcleo grátis, sem chave: **fast-flights** + **LetsFG** + **google-flights**
(agent-browser) reconciliados em BRL pela **AwesomeAPI** (fallback Frankfurter/BCE
e dolarhoje), com aeroportos do **OpenFlights**, visto do **passport-index** e
clima do **Open-Meteo**. Fontes opcionais com token grátis sem cartão:
**Travelpayouts** (3a fonte + datas baratas) e **AviationStack** (status de voo).

| Peça | Papel |
|---|---|
| `tools/flightfinder/` | Orquestrador Python (consenso, câmbio, visto, clima). |
| `.claude/skills/google-flights/` | Engine de navegador (Google Flights). |
| `.mcp.json` | Servidor MCP do LetsFG. |
| `tools/usd-brl/` + `bin/dolar` | Conversor USD->BRL (crate dolarhoje, fallback). |
| `.claude/hooks/setup-flightfinder.sh` | Hook SessionStart: instala/reconfigura tudo. |
| `.claude/settings.json` | Env (TLS p/ Python, browser), tokens, permissões. |

Tudo é **modular e degrada graciosamente**: se uma fonte ou chave faltar, aquela
camada some e o núcleo continua. Detalhes, tokens e onde obtê-los em
[CLAUDE.md](CLAUDE.md).

> Afinado para **Claude Code na web** (container efêmero, TLS interceptado). O
> hook reinstala tudo a cada sessão e replica o CA do proxy para o Python.
