# FlightFinder — direção visual de recuperação

## Princípio

O produto usa um tema claro, editorial e funcional. Referências de operações aeroportuárias aparecem apenas como detalhes de hierarquia, rotas e qualidade do dado — nunca como decoração que sugere atividade inexistente.

## Regras de integridade

- Nenhuma métrica, rota, fonte ou oportunidade aparece como real sem vir de uma API ou prop real.
- `live`, `cache`, `demo`, `hypothesis` e `unavailable` permanecem visíveis.
- Cache pode ser candidato, mas nunca ouro.
- Demo nunca é pérola.
- Google sozinho não é consenso.
- Estados vazios são preferíveis a dados visuais inventados.

## Componentes mantidos

- `RouteCanvas`: visualização discreta; recebe `nodes` e `routes` por props e usa apenas um fallback abstrato sem preços ou status.
- `AgentProgressLoader`: progresso funcional com etapas configuráveis.
- `DataQualityBadge`: comunica qualidade real do dado.
- `CandidateCard`: representa uma `Offer` real.
- `LuckyRevealCard`: representa uma oportunidade ou candidato com qualidade explícita.
- `GoldDepartureCard`: renderiza somente `LuckyDeal` com qualidade `live`.
- `DepartureBoard`: renderiza apenas linhas recebidas por props; sem rotas hardcoded.
- `SourceBadge` e `ProofPanel`: exibem apenas fontes recebidas.
- `CommandSearchBar`: interpreta uma consulta por regras simples e preenche o formulário técnico.

## Direção visual

- Fundo off-white e superfícies claras translúcidas.
- Tipografia legível, com mono apenas quando necessário para códigos ou números.
- Espaçamento generoso e hierarquia simples.
- Linhas de rota discretas e poucos acentos.
- Sem painéis de aeroporto literais, métricas inventadas, cards girados ou excesso de badges.

## Roadmap visual

A estética pode evoluir depois que dados e interações reais sustentarem novos painéis. WebGL, narrativa por scroll e visualizações operacionais mais densas permanecem fora desta recuperação.
