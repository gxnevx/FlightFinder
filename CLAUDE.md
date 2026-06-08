# CLAUDE.md

## O que é o FlightFinder

Agente de **busca de voos multi-fonte com modo consenso**, localizado para o
Brasil. Cruza várias fontes, reconcilia os preços em BRL, classifica a tarifa
(barata/típica/cara) e devolve a melhor opção com **nível de confiança**,
sinalizando divergências.

## Regras de saída (sempre)

- **Responda sempre em português (pt-BR).**
- **Valores sempre em BRL** (converta moedas estrangeiras via `flightfinder.currency`).
- **Considere ida e volta por padrão.** Só trate como só-ida se o usuário pedir.
- **Sem travessão (—)** no texto: use vírgula, dois-pontos ou parênteses.
- Não venda hipótese como certeza: se faltar prova, marque como "hipótese" ou
  "precisa validar manualmente".

## Como rodar

```bash
# Busca multi-fonte (modo consenso). --gf-usd injeta o preço do google-flights.
./bin/flightfinder GRU LIS 2026-09-10 --return 2026-09-24 [--adults 1] [--cabin economy] [--gf-usd 1167] [--json]

# Cotação USD->BRL (referência dolarhoje, fallback de câmbio)
./bin/dolar            # cotação atual
./bin/dolar 1167       # converte US$ -> BRL

# Status de um voo (opcional, exige AVIATIONSTACK_TOKEN)
./bin/flightfinder status TP1234
```

### Modo consenso (sempre que buscar voos)

Para cada busca consulte **ao menos google-flights (agent-browser) + fast-flights**.
Como o google-flights é dirigido por navegador (skill `google-flights`), o fluxo é:

1. Rode o `./bin/flightfinder ORIGEM DESTINO DATA --return DATA` (roda fast-flights
   + LetsFG + câmbio + visto + clima + consenso).
2. Rode o google-flights pela skill `google-flights` (agent-browser) e pegue a
   tarifa mais barata.
3. Re-rode com `--gf-usd <preço_usd>` para incorporar o google-flights ao consenso.

O consenso devolve: melhor opção, faixa de preço (mín/mediana/máx) em BRL,
classificação low/typical/high, nível de confiança e aviso quando as fontes
divergem mais que o limiar (padrão 15%, geralmente combos de autoconexão).

## Fontes (todas grátis)

| Camada | Fonte | Chave | Papel |
|---|---|---|---|
| Preço | **google-flights** (agent-browser) | não | ranking do Google, links, price insights |
| Preço | **fast-flights** (scraper, sem browser) | não | 2a fonte + sinal low/typical/high |
| Preço | **LetsFG** (`letsfg`, 400+ cias) | não | interlining virtual, combos |
| Preço | **Travelpayouts/Aviasales** | token grátis (opcional) | 3a fonte (cache 2-7d) + datas baratas |
| Câmbio | **AwesomeAPI** (USD-BRLT turismo + PTAX) | token grátis (opcional) | conversão preferencial |
| Câmbio | **Frankfurter** (BCE) | não | fallback multi-moeda (ex.: EUR) |
| Câmbio | **dolarhoje** (`./bin/dolar`) | não | fallback final, só USD |
| Aeroportos | **OpenFlights** | não | cidade -> IATA, alternativos (GRU/CGH/VCP) |
| Visto | **passport-index** | não | exigência para passaporte BR |
| Clima | **Open-Meteo** | não | previsão/clima histórico no destino |
| Status | **AviationStack** | token grátis (opcional) | status/terminal/atraso de voo |

Ao custo somamos o **IOF de compra internacional** (`IOF_PCT`, padrão 3,5%;
estimativa, ajuste conforme a regra vigente), senão a conversão fica otimista.

### Degradação graciosa

Tudo é modular: se uma fonte/chave faltar, aquela camada some e o **núcleo
continua**. Nunca bloqueie a busca por falta de chave. O nível de confiança
reflete quantas fontes responderam e o quanto concordam.

## Chaves (todas opcionais, grátis, sem cartão)

Defina em `.claude/settings.json` (bloco `env`). Sem elas, as features pulam.

- `AWESOMEAPI_TOKEN`: eleva a cota da AwesomeAPI (o tier sem token estoura no IP
  compartilhado da AWS, daí cair no Frankfurter). Cadastro grátis sem cartão:
  https://docs.awesomeapi.com.br/api-de-moedas
- `TRAVELPAYOUTS_TOKEN`: 3a fonte de preço + calendário de datas baratas. Token
  grátis no perfil (sem cartão): https://www.travelpayouts.com (docs
  https://travelpayouts.github.io/slate/, header `X-Access-Token`). Dados de
  cache (2-7 dias): use como tendência/referência, não como preço exato.
- `AVIATIONSTACK_TOKEN`: status de voo. Plano grátis sem cartão:
  https://aviationstack.com/signup/free (NUNCA cadastre forma de pagamento, para
  travar no limite em vez de cobrar).
- `IOF_PCT`: percentual de IOF somado na conversão (padrão "3.5").

## Ambiente e TLS (Claude Code na web)

- Container **efêmero**: o hook `.claude/hooks/setup-flightfinder.sh` (SessionStart)
  reinstala/reconfigura tudo a cada sessão (agent-browser + Chromium, `letsfg`
  npm+pip, `fast-flights` pip, pré-build do conversor dolarhoje).
- **TLS interceptado**: o Node confia no CA via `NODE_EXTRA_CA_CERTS`. Replicamos
  para o Python com `SSL_CERT_FILE` e `REQUESTS_CA_BUNDLE` apontando o bundle do
  sistema (`/etc/ssl/certs/ca-certificates.crt`), senão as chamadas HTTPS falham.
  O `bin/flightfinder` também seta isso.
- O google-flights usa `AGENT_BROWSER_IGNORE_HTTPS_ERRORS=true` e
  `--no-sandbox` (ver seção google-flights abaixo).
- **Não usar OpenSky** (bloqueia hyperscalers/AWS).

## Fora de escopo / não integrado

- **Compras/booking**, hotéis e carros.
- **APIs pagas/gated não integradas** (política grátis-primeiro): Duffel,
  Kiwi/Tequila, seats.aero, AeroDataBox. Ficam como possíveis plugins opcionais
  futuros, só se ativados por chave própria do usuário.

## google-flights (engine via agent-browser)

A skill `google-flights` dirige o Google Flights por automação de navegador.
Runtime no sandbox web:
- `AGENT_BROWSER_EXECUTABLE_PATH` aponta o Chromium do Playwright (symlink mantido
  pelo hook).
- `AGENT_BROWSER_IGNORE_HTTPS_ERRORS=true` (o proxy intercepta TLS; sem isso dá
  `ERR_CERT_AUTHORITY_INVALID`).
- `AGENT_BROWSER_ARGS=--no-sandbox` (container roda como root).

Smoke test:
```bash
agent-browser --session t open "https://www.google.com/travel/flights?q=Flights+from+GRU+to+LIS+on+2026-09-10+returning+2026-09-24" \
  && agent-browser --session t wait --load networkidle && agent-browser --session t snapshot -i && agent-browser --session t close
```

## Roadmap (planejado, ainda não implementado)

- Otimizador: matriz de datas flexíveis (+/- dias), aeroportos alternativos por
  raio, estratégias (posicionamento, split ticket, hidden city com ressalva,
  multimodal trem/ônibus).
- Modo "estou com sorte": destino aberto (anywhere) + deal_score + feeds de promo.
- Prova e perfil: arquivo de preferências do viajante, prova obrigatória por
  recomendação, ranking duplo (sem pegadinha vs agressivo), pasta `evals/`.
- Milhas Brasil: dinheiro vs milhas (Smiles, LATAM Pass, TudoAzul), best-effort.

## Troubleshooting

- `Chrome not found` / `ERR_CERT_AUTHORITY_INVALID`: rode
  `bash .claude/hooks/setup-flightfinder.sh` e confira `.claude/settings.json`.
- `--ignore-https-errors ignored: daemon already running`: `agent-browser close --all` e repita.
- Câmbio caindo no Frankfurter/dolarhoje: AwesomeAPI sem token estourou a cota;
  defina `AWESOMEAPI_TOKEN`.
- Datasets (aeroportos/visto) baixam para `tools/flightfinder/data/` (ignorado no git).
