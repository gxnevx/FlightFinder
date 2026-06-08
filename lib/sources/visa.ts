// Visto p/ passaporte brasileiro, normalizado por código ISO3 de país.
// Mapeia nome do país (OpenFlights) -> ISO3 -> dataset passport-index ISO3.
// Sem match confiável: "verifique manualmente" (não chuta por prefixo).
import { parseCsvLine, stripAccents } from "@/lib/csv";
import { fetchText } from "@/lib/http";
import type { VisaInfo } from "@/lib/types";

const URL = "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy-iso3.csv";

// Nome de país (normalizado, sem acento, minúsculo) -> ISO3.
const NAME_TO_ISO3: Record<string, string> = {
  "united states": "USA", "united states of america": "USA", brazil: "BRA",
  "united kingdom": "GBR", portugal: "PRT", spain: "ESP", france: "FRA", italy: "ITA",
  germany: "DEU", netherlands: "NLD", belgium: "BEL", switzerland: "CHE", austria: "AUT",
  ireland: "IRL", "czech republic": "CZE", czechia: "CZE", poland: "POL", greece: "GRC",
  hungary: "HUN", sweden: "SWE", norway: "NOR", denmark: "DNK", finland: "FIN",
  russia: "RUS", turkey: "TUR", "south korea": "KOR", "korea republic of": "KOR",
  "north korea": "PRK", japan: "JPN", china: "CHN", "hong kong": "HKG", macau: "MAC", macao: "MAC",
  thailand: "THA", vietnam: "VNM", "viet nam": "VNM", indonesia: "IDN", malaysia: "MYS",
  singapore: "SGP", philippines: "PHL", india: "IND", "united arab emirates": "ARE",
  qatar: "QAT", "saudi arabia": "SAU", israel: "ISR", egypt: "EGY", morocco: "MAR",
  "south africa": "ZAF", kenya: "KEN", nigeria: "NGA", "ivory coast": "CIV", "cote d ivoire": "CIV",
  ethiopia: "ETH", argentina: "ARG", chile: "CHL", uruguay: "URY", paraguay: "PRY",
  bolivia: "BOL", peru: "PER", colombia: "COL", ecuador: "ECU", venezuela: "VEN",
  mexico: "MEX", canada: "CAN", panama: "PAN", "costa rica": "CRI", cuba: "CUB",
  "dominican republic": "DOM", australia: "AUS", "new zealand": "NZL", "cape verde": "CPV",
  "cabo verde": "CPV", angola: "AGO", mozambique: "MOZ", "united republic of tanzania": "TZA",
  tanzania: "TZA", iceland: "ISL", croatia: "HRV", serbia: "SRB", romania: "ROU", bulgaria: "BGR",
};

let cache: Map<string, string> | null = null;

function pt(req: string): { message: string; needsVisa: boolean | null } {
  const r = (req || "").trim().toLowerCase();
  if (/^\d+$/.test(r)) return { message: `sem visto (livre por até ${r} dias)`, needsVisa: false };
  const table: Record<string, { message: string; needsVisa: boolean | null }> = {
    "visa free": { message: "sem visto", needsVisa: false },
    "visa on arrival": { message: "visto na chegada", needsVisa: false },
    "e-visa": { message: "visto eletrônico (e-visa) exigido", needsVisa: true },
    evisa: { message: "visto eletrônico (e-visa) exigido", needsVisa: true },
    eta: { message: "autorização eletrônica (eTA) exigida", needsVisa: true },
    "visa required": { message: "exige visto", needsVisa: true },
    "no admission": { message: "entrada não permitida", needsVisa: true },
  };
  return table[r] || { message: `verifique manualmente (${req})`, needsVisa: null };
}

async function load(): Promise<Map<string, string>> {
  if (cache) return cache;
  const map = new Map<string, string>();
  try {
    const text = await fetchText(URL, { timeout: 15000 });
    const lines = text.split("\n");
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const f = parseCsvLine(lines[i]);
      if (f.length < 3) continue;
      if (f[0].trim().toUpperCase() === "BRA") map.set(f[1].trim().toUpperCase(), f[2]);
    }
  } catch {
    /* indisponível */
  }
  cache = map;
  return map;
}

const norm = (s: string) => stripAccents(s).replace(/[^a-z0-9]+/g, " ").trim();

export async function checkVisa(destCountry: string, _passport = "Brazil"): Promise<VisaInfo> {
  const iso3 = NAME_TO_ISO3[norm(destCountry)];
  if (!iso3) {
    return { country: destCountry, iso3: null, requirementRaw: null, message: "verifique manualmente (país não normalizado)", needsVisa: null };
  }
  const table = await load();
  const raw = table.get(iso3) ?? null;
  if (raw == null) {
    return { country: destCountry, iso3, requirementRaw: null, message: "verifique manualmente (sem dado para o ISO3)", needsVisa: null };
  }
  const { message, needsVisa } = pt(raw);
  return { country: destCountry, iso3, requirementRaw: raw, message, needsVisa };
}
