import type { SearchRequest } from "@/lib/types";

export interface ParsedFlightQuery {
  request: Partial<SearchRequest>;
  originLabel?: string;
  destinationLabel?: string;
  intent?: "europe" | "weekend" | "beach";
  durationDays?: number;
  understood: string[];
  missing: string[];
}

const DESTINATIONS: Record<string, { code: string; label: string }> = {
  lisboa: { code: "LIS", label: "Lisboa" },
  paris: { code: "CDG", label: "Paris" },
  madrid: { code: "MAD", label: "Madrid" },
  roma: { code: "FCO", label: "Roma" },
  miami: { code: "MIA", label: "Miami" },
  santiago: { code: "SCL", label: "Santiago" },
  buenos: { code: "EZE", label: "Buenos Aires" },
  tóquio: { code: "NRT", label: "Tóquio" },
  toquio: { code: "NRT", label: "Tóquio" },
};

const MONTHS: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

const iso = (date: Date) => date.toISOString().slice(0, 10);

function nextMonthDate(month: number) {
  const now = new Date();
  let year = now.getUTCFullYear();
  if (month < now.getUTCMonth()) year += 1;
  return new Date(Date.UTC(year, month, 15));
}

export function parseFlightQuery(raw: string): ParsedFlightQuery {
  const query = raw.toLocaleLowerCase("pt-BR").trim();
  const request: Partial<SearchRequest> = {};
  const understood: string[] = [];

  let originLabel: string | undefined;
  if (/são paulo|sao paulo|\bsp\b|\bgru\b|\bcgh\b|\bvcp\b/.test(query)) {
    request.origin = "GRU";
    request.acceptsAlternativeAirports = true;
    originLabel = "São Paulo (GRU, CGH e VCP)";
    understood.push(`origem: ${originLabel}`);
  }

  const destination = Object.entries(DESTINATIONS).find(([name]) => query.includes(name))?.[1];
  if (destination) {
    request.destination = destination.code;
    understood.push(`destino: ${destination.label} (${destination.code})`);
  }

  const month = Object.entries(MONTHS).find(([name]) => query.includes(name));
  const durationMatch = query.match(/(\d{1,2})\s*dias?/);
  const durationDays = durationMatch ? Number(durationMatch[1]) : /fim de semana/.test(query) ? 3 : undefined;
  if (month) {
    const departure = nextMonthDate(month[1]);
    request.departureDate = iso(departure);
    request.returnDate = iso(new Date(departure.getTime() + (durationDays || 7) * 86400000));
    understood.push(`janela: ${month[0]}${durationDays ? `, ${durationDays} dias` : ""}`);
  }

  let intent: ParsedFlightQuery["intent"];
  if (/europa/.test(query)) intent = "europe";
  if (/fim de semana/.test(query)) intent = "weekend";
  if (/praia/.test(query)) intent = "beach";
  if (intent) understood.push(`intenção: ${intent}`);

  return {
    request,
    originLabel,
    destinationLabel: destination?.label,
    intent,
    durationDays,
    understood,
    missing: [!request.origin && "origem", !request.destination && "destino", !request.departureDate && "mês ou data"].filter(Boolean) as string[],
  };
}
