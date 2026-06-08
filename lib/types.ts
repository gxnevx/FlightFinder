// Tipos compartilhados entre engine, API routes e UI.

// Qualidade do dado: nunca apresentar algo fabricado como real.
export type DataQuality = "live" | "cache" | "demo" | "hypothesis" | "manual_validation_required" | "unavailable";

export type Confidence = "alta" | "média" | "baixa" | "indisponível";
export type RiskLevel = "baixo" | "médio" | "alto";

export interface Offer {
  source: string;
  engine: string; // motor de dados real (google, letsfg, travelpayouts, duffel, seats-aero, mock...)
  dataQuality: DataQuality;
  airline: string;
  price: number | null; // moeda original
  currency: string;
  priceBrl: number | null; // já com IOF
  stops: number | null;
  duration: string;
  departure?: string;
  arrival?: string;
  bookingUrl?: string | null;
  checkedAt?: string; // ISO, quando a fonte forneceu
}

export interface RateInfo {
  source: string;
  iofPct: number;
  iofApplied: boolean;
  iofLabel: string; // premissa explícita mostrada ao usuário
  usdBase: number | null;
  usdEffective: number | null;
  ptaxUsd: number | null;
  currencies: Record<string, { base: number | null; effective: number | null }>;
  trendNote?: string;
  warnings: string[];
  checkedAt: string;
}

export interface Consensus {
  sourcesUsed: string[]; // nomes das fontes que entraram
  independentEngines: string[]; // motores independentes (google conta 1x)
  sourcesFailed: string[];
  cheapest: Offer | null;
  minBrl: number | null;
  medianBrl: number | null;
  maxBrl: number | null;
  spreadPct: number | null;
  confidence: Confidence;
  priceSignal?: "low" | "typical" | "high" | null;
  divergent: boolean;
  dataQuality: DataQuality; // melhor qualidade entre as ofertas usadas
  notes: string[];
}

export interface VisaInfo {
  country: string;
  iso3?: string | null;
  requirementRaw: string | null;
  message: string;
  needsVisa: boolean | null;
}

export type SourceState = "ativa" | "sem-chave" | "fallback" | "indisponível" | "erro" | "experimental";

export interface SourceStatus {
  key: string;
  label: string;
  role: "discovery" | "validation" | "baseline" | "routing" | "enrichment" | "mock";
  state: SourceState;
  dataQuality: DataQuality;
  note: string;
  needsKey?: string;
}

export interface SearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  passengers?: number;
  cabin?: "economy" | "premium" | "business" | "first";
  flexibilityDays?: 0 | 1 | 3 | 7;
  baggage?: "none" | "carry_on" | "checked";
  acceptsAlternativeAirports?: boolean;
  passport?: string;
  demo?: boolean; // força ofertas de demonstração SÓ para testar layout
}

export interface SearchResponse {
  query: SearchRequest & { resolvedOrigin: string; resolvedDest: string; destCountry: string | null };
  consensus: Consensus;
  bestNoTrick: Offer | null; // melhor sem pegadinha (um bilhete, fonte confiável)
  bestAggressive: Offer | null; // pode ter bilhete separado / conexão / data alternativa
  cheapestRaw: Offer | null; // menor preço bruto (pode ter pegadinha)
  savingsPct: number | null; // só quando comparando estratégias reais distintas
  rate: RateInfo;
  visa: VisaInfo | null;
  weather: string | null;
  alternatives: { origin: string[]; dest: string[] };
  sources: SourceStatus[];
  warnings: string[];
  dataQuality: DataQuality;
  honestMessage?: string; // ex.: "nenhuma fonte real configurada"
  bookingUrl?: string;
  topOffers?: Offer[];
}

export interface LuckyDeal {
  headline: string;
  origin: string;
  destination: string;
  destinationName: string;
  startDate: string;
  endDate: string;
  totalPriceBrl: number;
  typicalPriceBrl: number | null;
  percentBelowTypical: number | null;
  dealScore: number;
  urgency: string;
  confidence: Confidence;
  dataQuality: DataQuality;
  sourcesUsed: string[];
  caveats: string[];
}
