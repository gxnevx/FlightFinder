# ✈️ FlightFinder

App web + agente de **busca de voos multi-fonte com modo consenso**, localizado
para o Brasil (respostas em português, valores em BRL, ida e volta por padrão).

Cruza várias fontes, reconcilia os preços em reais (com IOF), classifica a tarifa
(barata/típica/cara) e devolve a melhor opção **sem pegadinha** e a mais
**agressiva**, com nível de confiança, visto para passaporte brasileiro e clima.

## App web (Next.js + Vercel + Supabase)

UI estilo cockpit (dark, glassmorphism, 3D) para usar tudo pelo navegador:

- **/** cockpit: explica, atalhos e status das fontes ao vivo
- **/search** busca normal (ida e volta, consenso em BRL)
- **/lucky** "estou com sorte": destino aberto + deal score
- **/advanced** busca avançada + estratégias
- **/evals** testes reproduzíveis
- **/history** histórico (Supabase ou memória)

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção (usado pelo Vercel)
```

### Rotas de API

`GET /api/health` · `GET /api/sources` · `POST /api/search` · `POST /api/lucky` ·
`POST /api/advanced-search` · `POST /api/evals/run` · `POST/GET /api/preferences` ·
`GET /api/history/{searches,lucky-deals,evals}`

### Variáveis de ambiente (configure no painel do Vercel, NUNCA no código)

Nada é obrigatório: sem nada, a app roda em modo demo/memória e avisa na UI.
Veja `.env.example` para a lista completa de nomes.

Públicas (client): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Servidor (nunca expostas ao client): `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_URL`,
`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_HOST`,
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`.

Fontes opcionais (token grátis, sem cartão): `AWESOMEAPI_TOKEN`,
`TRAVELPAYOUTS_TOKEN`, `AVIATIONSTACK_TOKEN`. Worker externo (fontes de
browser/scraper que não rodam serverless): `FLIGHT_WORKER_URL`,
`FLIGHT_WORKER_TOKEN`. Conversão: `IOF_PCT`.

### O que roda no Vercel vs. fora

Reais em serverless (TypeScript): **câmbio** (AwesomeAPI + Frankfurter/BCE),
**aeroportos** (OpenFlights), **visto** (passport-index), **clima** (Open-Meteo),
**consenso**, e **Travelpayouts** (se houver token).

Não rodam em serverless (browser/scraper Python): **google-flights**,
**fast-flights**, **LetsFG**. Sem `FLIGHT_WORKER_URL`, esses preços vêm de
**mock marcado como demo** na UI. O adapter já está pronto para apontar para um
worker externo (o core Python em `tools/`).

### Banco (Supabase)

Schema em `supabase/migrations/0001_init.sql` (tabelas `searches`,
`search_results`, `lucky_deals`, `eval_runs`, `source_logs`, `user_preferences`,
com RLS habilitado e acesso só via API routes server-side). Sem Supabase
configurado, o histórico fica em memória.

## Core Python (CLI, opcional, fora do Vercel)

```bash
./bin/flightfinder GRU LIS 2026-09-10 --return 2026-09-24 [--gf-usd 1167] [--json]
```

`tools/flightfinder/` é o orquestrador de consenso com as fontes de browser/scraper
(google-flights via agent-browser, fast-flights, LetsFG) que rodam em ambiente com
Node/Python/Chromium. Pode virar o worker externo que alimenta a app web. Detalhes
e tokens em [CLAUDE.md](CLAUDE.md).
