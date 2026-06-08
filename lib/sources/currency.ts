// Câmbio para BRL (custo final). AwesomeAPI (turismo + PTAX) com fallback
// Frankfurter (BCE) multi-moeda. Soma IOF de compra internacional.
import { fetchJson } from "@/lib/http";

const AWESOME = "https://economia.awesomeapi.com.br/json";
const FRANKFURTER = "https://api.frankfurter.app/latest";

export interface RateData {
  base: Record<string, number>; // MOEDA -> R$ por unidade (sem IOF)
  ptaxUsd: number | null;
  iofPct: number;
  source: string;
  trendNote?: string;
  warnings: string[];
  checkedAt: string;
}

function iofPct(): number {
  const v = Number(process.env.IOF_PCT);
  return Number.isFinite(v) && v > 0 ? v : 3.5;
}

function tokenSuffix(): string {
  const t = (process.env.AWESOMEAPI_TOKEN || "").trim();
  return t ? `?token=${t}` : "";
}

export function effective(base: number, iof: number): number {
  return base * (1 + iof / 100);
}

export function toBrl(amount: number | null, currency: string, rate: RateData): number | null {
  if (amount == null) return null;
  const b = rate.base[(currency || "USD").toUpperCase()];
  return b == null ? null : amount * effective(b, rate.iofPct);
}

export async function getRate(currencies: string[]): Promise<RateData> {
  const set = new Set<string>(["USD", ...currencies.map((c) => (c || "USD").toUpperCase())]);
  const rate: RateData = {
    base: {},
    ptaxUsd: null,
    iofPct: iofPct(),
    source: "indisponível",
    warnings: [],
    checkedAt: new Date().toISOString(),
  };

  // 1) AwesomeAPI (uma chamada com vários pares)
  const pairs = ["USD-BRLT", "USD-BRLPTAX", ...[...set].filter((c) => c !== "USD").map((c) => `${c}-BRL`)];
  try {
    const d = await fetchJson<Record<string, any>>(`${AWESOME}/last/${pairs.join(",")}${tokenSuffix()}`, { timeout: 9000 });
    const grab = (k: string) => {
      const v = d[k];
      if (!v) return null;
      const n = Number(v.ask ?? v.bid);
      return Number.isFinite(n) ? n : null;
    };
    const usdT = grab("USDBRLT");
    if (usdT) rate.base["USD"] = usdT;
    rate.ptaxUsd = grab("USDBRLPTAX");
    for (const c of set) {
      if (c === "USD") continue;
      const v = grab(`${c}BRL`);
      if (v) rate.base[c] = v;
    }
    if (Object.keys(rate.base).length) rate.source = rate.ptaxUsd ? "AwesomeAPI (turismo + PTAX)" : "AwesomeAPI";
  } catch (e: any) {
    rate.warnings.push(`AwesomeAPI indisponível (${e?.message || "erro"})`);
  }

  // 2) Frankfurter (BCE) para moedas que faltaram
  let usedFrank = false;
  for (const c of set) {
    if (rate.base[c]) continue;
    try {
      const d = await fetchJson<any>(`${FRANKFURTER}?from=${c}&to=BRL`, { timeout: 8000 });
      const v = Number(d?.rates?.BRL);
      if (Number.isFinite(v)) {
        rate.base[c] = v;
        usedFrank = true;
      }
    } catch {
      /* ignora */
    }
  }
  if (usedFrank) rate.source = rate.source.startsWith("AwesomeAPI") ? `${rate.source} + Frankfurter` : "Frankfurter (BCE)";

  if (!Object.keys(rate.base).length) rate.warnings.push("nenhuma fonte de câmbio disponível");
  return rate;
}
