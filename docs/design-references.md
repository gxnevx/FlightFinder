# FlightFinder — Direção de arte e referências

> Tema: **claro premium, experimental, com identidade**. Não é dark mode, não é
> "Tailwind bonitinho", não é formulário bege. A sensação alvo:
> **um terminal inteligente que caça oportunidades de voo em tempo real** —
> laboratório editorial de IA + cockpit claro de aeroporto + route intelligence.

## 1. Como cada referência vira produto

| Referência | O que tomamos | Onde aplica |
|---|---|---|
| **Air** | arquitetura SaaS, cards de produto, dashboard premium, whitespace | resultados como cards de produto, painel de fontes |
| **Novu** | command-bar UX, ação principal claríssima, calma | busca por linguagem natural; CTA "estou com sorte" |
| **General Intelligence Co.** | AI lab, manifesto, sistema de agentes | copy de manifesto na home, "agente que caça assimetrias" |
| **DefinedVC** | taxonomy, princípios, categorias, frontier-tech | papéis de fonte (discovery/validation/baseline), badges técnicos |
| **Poch Studio** | direção de arte, tracking alto, layout editorial | tipografia display, labels uppercase, composição |
| **Yourbana** | progress loader, capítulos, scroll/drag, narrativa | AgentProgressLoader, scroll-driven na home |
| **Abhishek Jha** | hero Awwwards, tipografia gigante, assimetria, marquee | hero da home, FlightTicker/marquee |
| **Because Recollection** | exploração, canvas, rotas, descoberta | RouteCanvas (nós de aeroporto, linhas animadas) |
| **FIDS / departures board** | linhas de voo, status, códigos, gates, update em tempo real | DepartureBoard, status scanning/validating/gold |
| **Boarding pass UI** | hierarquia rota/datas/preço/status | BoardingPassCard / CandidateCard |
| **Airline ops dashboard** | fontes, validação, risco, confiança, logs | painéis de prova, meters de confiança/risco |

Linguagem conceitual de aeroporto (sistema visual, **não** copiar o amarelo/preto
literal): FIDS, split-flap, wayfinding, gate status, route map, control room.

## 2. Design system — claro experimental (substitui paper/ink)

Tokens (a implementar em `tailwind.config` + CSS vars):

- background.primary `#f7f7f4` (ivory, não bege morto) · background.elevated `#ffffff`
- background.glass `rgba(255,255,255,.6)` + blur · background.terminal `#f0f1ee`
- border.subtle `#e7e6df` · border.technical `#d4d3c8` (linha fina técnica)
- accent.lime `#a3e635` · accent.blue `#2563eb` · accent.amber `#f59e0b` · accent.coral `#fb7185` (uso controlado)
- text.primary `#16160f` · text.secondary `#56544b` · text.faint `#9b988d`
- signal.good/warn/bad · data.real/cache/demo/hypothesis · risk.low/med/high
- status.scanning/validating/candidate/rejected/gold
- tipografia: display grande (títulos), labels pequenos uppercase com tracking,
  **números monoespaçados** para preço/horário/score/código.
- texturas: noise/paper-grain sutil, grid técnico, linhas de rota no fundo.

## 3. Componentes a construir

Visual: `RouteCanvas`, `AgentProgressLoader`, `DepartureBoard`, `FlightRow`,
`BoardingPassCard`, `CandidateCard`, `LuckyRevealCard`, `GoldDepartureCard`,
`RouteTimeline`, `DealScoreGauge`, `ConfidenceMeter`, `RiskMeter`, `SourceBadge`,
`DataQualityBadge`, `GateStatusBadge`, `ProofPanel`, `TerminalStatusBar`,
`FlightTicker`, `SplitFlapText`, `AirportNodeMap`, `RouteMapPanel`.

## 4. Direção por página

- **/** entrada com hero gigante + command bar central + DepartureBoard de
  oportunidades + mini painel (próximas partidas, fontes, deal score). Copy:
  "encontre a viagem que ninguém percebeu ainda" / "não busca passagens, caça assimetrias".
- **/lucky** tela-assinatura: botão "revelar uma pérola", RouteCanvas com nós
  GRU/CGH/VCP testando destinos (scanning/checking/validating/candidate/rejected/
  live/cache/demo/gold), reveal final estilo "gate announcement". Demo/cache
  rotulado claramente, nunca vendido como ouro.
- **/search** command interface (linguagem natural) + interpretação do agente
  antes de buscar (origem/destino/datas/flex/fontes); avançado colapsável.
- **/advanced** strategy cockpit: cards de estratégia com status (ativo/precisa
  API/demo/experimental), grafo de geração de candidatos, rotas testadas/rejeitadas.
- **/history** galeria de descobertas (boarding passes), filtros real/cache/demo,
  score, destino; flight log das buscas.
- **/evals** laboratório: execuções, fonte, duração, status, logs, candidates.

## 5. Regras invioláveis (integridade visual)

- Mostrar sempre `dataQuality` (live/cache/demo/hypothesis), fonte, `checkedAt`,
  risco, confiança e prova. Nunca esconder demo/cache.
- Demo/cache jamais com visual de "oportunidade real validada".
- Loader intencional (>=1s), com etapas nomeadas e status de fonte.
- Continua **light**. Sem dark mode. Sem skeleton genérico. Sem fundo parado.

## 6. Estado implementado

A base foi substituída pelo terminal claro experimental: RouteCanvas animado, AgentProgressLoader, DepartureBoard, BoardingPassCard, command interface, strategy cockpit, galeria de histórico, laboratório de evals, ticker/split-flap e tokens técnicos. O SVG/canvas leve preserva performance e deixa uma evolução futura para WebGL sem tornar a experiência dependente dele.

## 7. Implementação entregue — registro de assets e vetores

Os assets são originais e gerados em código para preservar nitidez, performance e consistência. Nenhum asset visual das referências foi copiado.

| Asset / componente | Linguagem visual | Função / localização |
|---|---|---|
| `RouteCanvas` | mapa abstrato, curvas de rota, nós pulsantes e contornos | hero, `/lucky`, `/search`, `/advanced`; modos idle/searching/reveal |
| `TerminalStatusBar` | telemetria de control room | barra global superior com hubs, fontes, latência e relógio |
| `DepartureBoard` / `FlightRow` | FIDS premium claro | stream de oportunidades e rotas testadas |
| `BoardingPassCard` | boarding pass editorial com stub e barcode | oportunidades, resultados e galeria de histórico |
| `AgentProgressLoader` | progress ring + log operacional | caça lucky e laboratório de evals; substitui skeleton |
| `GateStatusBadge` | chip técnico cromático | live/cache/demo/scanning/validating/candidate/rejected/gold |
| `FlightTicker` | split-flap/marquee contemporâneo | ticker global de rotas e preços |
| `StrategyCard` | taxonomy de laboratório | cockpit de estratégias e doutrina do agente |
| `MetricPanel` | instrumento operacional | fontes, scores, timings e telemetria |
| grid/noise/contours | textura laboratorial clara | backdrop global e canvas, sem prejudicar legibilidade |

## 8. Validação contra o brief

- O tema permanece exclusivamente claro, usando ivory, superfícies glass e graphite.
- A home é uma experiência de entrada full-bleed com hero assimétrico, command bar, mapa e boarding pass flutuante.
- `/lucky` possui caça própria, route graph, candidate stream, progress operacional e reveal honesto por qualidade.
- `/search` começa por linguagem natural e explicita a interpretação antes dos parâmetros técnicos.
- `/advanced` apresenta estratégias como cockpit, com estados visíveis e grafo de rotas.
- `/history` é uma galeria de descobertas; `/evals` é um laboratório de telemetria.
- Resultados exibem boarding pass, qualidade, confiança, fontes, checkedAt e prova já disponível no payload.
