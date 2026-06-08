// Tipos compartilhados entre engine, API routes e UI.

export type Confidence = "alta" | "média" | "baixa" | "indisponível";
export type RiskLevel = "baixo" | "médio" | "alto";

export interface Offer {
  source: string;
  airline: string;
  price: number | null; // moeda original
  currency: string;
  priceBrl: number | null; // já com IOF
  stops: number | null;
  duration: string;
  departure?: string;
  arrival?: string;
  bookingUrl?: string | null;
  demo?: boolean; // marcado quando vem de mock/fallback
}

export interface RateInfo {
  source: string;
  iofPct: number;
  usdBase: number | null;
  usdEffective: number | null;
  ptaxUsd: number | null;
  currencies: Record<string, { base: number | null; effective: number | null }>;
  trendNote?: string;
  warnings: string[];
  checkedAt: string; // ISO
}

export interface Consensus {
  sourcesUsed: string[];
  sourcesFailed: string[];
  cheapest: Offer | null;
  minBrl: number | null;
  medianBrl: number | null;
  maxBrl: number | null;
  spreadPct: number | null;
  confidence: Confidence;
  priceSignal?: "low" | "typical" | "high" | null;
  divergent: boolean;
  notes: string[];
}

export interface VisaInfo {
  country: string;
  requirementRaw: string | null;
  message: string;
  needsVisa: boolean | null;
}

export type SourceState = "ativa" | "sem-chave" | "fallback" | "indisponível" | "mock";

export interface SourceStatus {
  key: string;
  label: string;
  state: SourceState;
  note: string;
  needsKey?: string; // nome da env var
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
  acceptsSplitTicket?: boolean;
  acceptsMultimodal?: boolean;
  acceptsAggressiveRoutes?: boolean;
  passport?: string;
  gfUsd?: number | null;
}

export interface SearchResponse {
  query: SearchRequest & { resolvedOrigin: string; resolvedDest: string; destCountry: string | null };
  consensus: Consensus;
  bestClean: Offer | null;
  bestAggressive: Offer | null;
  savingsPct: number | null;
  rate: RateInfo;
  visa: VisaInfo | null;
  weather: string | null;
  alternatives: { origin: string[]; dest: string[] };
  sources: SourceStatus[];
  warnings: string[];
  demo: boolean; // true se algum preço veio de mock
  bookingUrl?: string; // abre o Google Flights na rota/data p/ reservar
  topOffers?: Offer[]; // tarifas mais baratas (para os cards de resultado)
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
  dealScore: number; // 0..100
  urgency: string;
  confidence: Confidence;
  sourcesUsed: string[];
  caveats: string[];
  demo: boolean;
}
