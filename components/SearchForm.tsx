"use client";

import { useState, type ReactNode } from "react";
import ResultView from "@/components/ResultView";
import { Glass, Toggle } from "@/components/ui";

const future = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-white/40">{label}</span>
      {children}
    </label>
  );
}

function Segmented({ options, value, onChange }: { options: { v: any; l: string }[]; value: any; onChange: (v: any) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-xl px-3 py-2 text-sm transition ${
            value === o.v ? "bg-cockpit-accent/20 text-white glow-accent" : "bg-white/5 text-white/55 hover:text-white"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export default function SearchForm({ endpoint, advanced = false }: { endpoint: string; advanced?: boolean }) {
  const [f, setF] = useState<any>({
    origin: "GRU",
    destination: "LIS",
    departureDate: future(90),
    returnDate: future(97),
    passengers: 1,
    flexibilityDays: 0,
    baggage: "carry_on",
    acceptsAlternativeAirports: true,
    acceptsSplitTicket: false,
    acceptsMultimodal: false,
    acceptsAggressiveRoutes: true,
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const up = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));

  async function go() {
    setLoading(true);
    setData(null);
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      setData(await r.json());
    } catch {
      setData({ error: "falha na busca" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Glass className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Origem"><input className="input-field" value={f.origin} onChange={(e) => up("origin", e.target.value.toUpperCase())} /></Field>
          <Field label="Destino"><input className="input-field" value={f.destination} onChange={(e) => up("destination", e.target.value.toUpperCase())} /></Field>
          <Field label="Ida"><input type="date" className="input-field" value={f.departureDate} onChange={(e) => up("departureDate", e.target.value)} /></Field>
          <Field label="Volta"><input type="date" className="input-field" value={f.returnDate} onChange={(e) => up("returnDate", e.target.value)} /></Field>
          <Field label="Passageiros"><input type="number" min={1} className="input-field" value={f.passengers} onChange={(e) => up("passengers", +e.target.value)} /></Field>
          <Field label="Flexibilidade de datas"><Segmented value={f.flexibilityDays} onChange={(v) => up("flexibilityDays", v)} options={[{ v: 0, l: "exata" }, { v: 1, l: "±1" }, { v: 3, l: "±3" }, { v: 7, l: "±7" }]} /></Field>
        </div>
        <Field label="Bagagem"><Segmented value={f.baggage} onChange={(v) => up("baggage", v)} options={[{ v: "none", l: "sem mala" }, { v: "carry_on", l: "mão" }, { v: "checked", l: "despachada" }]} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle checked={f.acceptsAlternativeAirports} onChange={(v) => up("acceptsAlternativeAirports", v)} label="Aeroportos alternativos" />
          <Toggle checked={f.acceptsSplitTicket} onChange={(v) => up("acceptsSplitTicket", v)} label="Bilhetes separados" />
          <Toggle checked={f.acceptsMultimodal} onChange={(v) => up("acceptsMultimodal", v)} label="Trem/ônibus/ferry" />
          <Toggle checked={f.acceptsAggressiveRoutes} onChange={(v) => up("acceptsAggressiveRoutes", v)} label="Rotas agressivas" />
        </div>
        <button
          onClick={go}
          disabled={loading}
          className="w-full rounded-2xl bg-cockpit-accent/90 py-3 font-semibold text-[#04121c] transition hover:bg-cockpit-accent disabled:opacity-50"
        >
          {loading ? "buscando…" : "Buscar (consenso · BRL)"}
        </button>
      </Glass>

      {loading && <div className="glass h-40 shimmer" />}
      {advanced && data?.strategies && (
        <Glass>
          <div className="mb-2 text-sm font-medium text-white/80">Estratégias</div>
          <div className="flex flex-wrap gap-2">
            {data.strategies.map((s: any) => (
              <span
                key={s.key}
                className={`pill border ${s.available ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-white/45"}`}
              >
                {s.label}
                {s.note ? ` (${s.note})` : ""}
              </span>
            ))}
          </div>
        </Glass>
      )}
      {data && !loading && <ResultView data={data} />}
    </div>
  );
}
