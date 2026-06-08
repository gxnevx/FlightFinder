// Clima no destino nas datas do voo via Open-Meteo (sem chave). Datas a até ~14
// dias usam previsão; datas distantes usam média histórica do ano anterior.
import { fetchJson } from "@/lib/http";

const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const DAILY = "temperature_2m_max,temperature_2m_min,precipitation_sum";

function avg(xs: (number | null | undefined)[]): number | null {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function prevYear(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

export async function weatherSummary(city: string, startDate: string, endDate?: string | null): Promise<string | null> {
  let geo: any;
  try {
    geo = await fetchJson<any>(`${GEO}?name=${encodeURIComponent(city)}&count=1&language=pt`, { timeout: 8000 });
  } catch {
    return null;
  }
  const r = (geo?.results || [])[0];
  if (!r) return null;
  const { latitude: lat, longitude: lon, name } = r;
  const end = endDate || startDate;

  const today = new Date();
  const start = new Date(startDate + "T00:00:00Z");
  const ahead = Math.round((start.getTime() - today.getTime()) / 86400000);

  let url: string;
  let label: string;
  if (ahead >= 0 && ahead <= 14) {
    url = `${FORECAST}?latitude=${lat}&longitude=${lon}&daily=${DAILY}&timezone=auto&start_date=${startDate}&end_date=${end}`;
    label = "previsão";
  } else {
    url = `${ARCHIVE}?latitude=${lat}&longitude=${lon}&daily=${DAILY}&timezone=auto&start_date=${prevYear(startDate)}&end_date=${prevYear(end)}`;
    label = "média histórica (mesmo período do ano passado)";
  }

  try {
    const d = await fetchJson<any>(url, { timeout: 9000 });
    const daily = d?.daily || {};
    const tmax = avg(daily.temperature_2m_max || []);
    const tmin = avg(daily.temperature_2m_min || []);
    const prec: number[] = daily.precipitation_sum || [];
    const rainDays = prec.filter((p) => p && p > 1).length;
    if (tmax == null) return null;
    const chuva = rainDays === 0 ? "sem chuva relevante" : `${rainDays} dia(s) com chuva`;
    return `${name} (${label}): máx ~${Math.round(tmax)}°C, mín ~${Math.round(tmin ?? 0)}°C, ${chuva}`;
  } catch {
    return null;
  }
}
