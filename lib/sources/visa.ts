// Checagem de visto para passaporte brasileiro (dataset passport-index, sem chave).
import { parseCsvLine, stripAccents } from "@/lib/csv";
import { fetchText } from "@/lib/http";
import type { VisaInfo } from "@/lib/types";

const URL = "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy.csv";

const ALIASES: Record<string, string> = {
  "czech republic": "czechia",
  "cape verde": "cabo verde",
  macau: "macao",
  burma: "myanmar",
  "ivory coast": "cote d ivoire",
  swaziland: "eswatini",
  "east timor": "timor leste",
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

async function load(passport = "Brazil"): Promise<Map<string, string>> {
  if (cache) return cache;
  const map = new Map<string, string>();
  const pn = stripAccents(passport);
  try {
    const text = await fetchText(URL, { timeout: 15000 });
    const lines = text.split("\n");
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const f = parseCsvLine(lines[i]);
      if (f.length < 3) continue;
      if (stripAccents(f[0]) === pn) map.set(stripAccents(f[1]), f[2]);
    }
  } catch {
    /* indisponível */
  }
  cache = map;
  return map;
}

export async function checkVisa(destCountry: string, passport = "Brazil"): Promise<VisaInfo> {
  const table = await load(passport);
  let key = stripAccents(destCountry);
  key = stripAccents(ALIASES[key] || key);
  let raw = table.get(key) ?? null;
  if (raw == null) {
    for (const [k, v] of table) {
      if (k && (k.startsWith(key) || key.startsWith(k))) {
        raw = v;
        break;
      }
    }
  }
  if (raw == null)
    return {
      country: destCountry,
      requirementRaw: null,
      message: "não foi possível determinar (verifique manualmente)",
      needsVisa: null,
    };
  const { message, needsVisa } = pt(raw);
  return { country: destCountry, requirementRaw: raw, message, needsVisa };
}
