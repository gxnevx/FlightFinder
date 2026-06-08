"use client";

import { useState, type ReactNode } from "react";
import ResultView from "@/components/ResultView";
import { Eyebrow, Toggle } from "@/components/ui";

const future = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Chips({ options, value, onChange }: { options: { v: any; l: string }[]; value: any; onChange: (v: any) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`chip ${value === o.v ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"}`}
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
    cabin: "economy",
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
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      setData(await r.json());
    } catch {
      setData({ error: "falha na busca" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-14">
      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Origem"><input className="field" value={f.origin} onChange={(e) => up("origin", e.target.value.toUpperCase())} /></Field>
          <Field label="Destino"><input className="field" value={f.destination} onChange={(e) => up("destination", e.target.value.toUpperCase())} /></Field>
          <Field label="Ida"><input type="date" className="field" value={f.departureDate} onChange={(e) => up("departureDate", e.target.value)} /></Field>
          <Field label="Volta"><input type="date" className="field" value={f.returnDate} onChange={(e) => up("returnDate", e.target.value)} /></Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Passageiros"><input type="number" min={1} className="field" value={f.passengers} onChange={(e) => up("passengers", +e.target.value)} /></Field>
          <div><span className="label">Cabine</span><Chips value={f.cabin} onChange={(v) => up("cabin", v)} options={[{ v: "economy", l: "Econômica" }, { v: "premium", l: "Premium" }, { v: "business", l: "Executiva" }, { v: "first", l: "Primeira" }]} /></div>
          <div><span className="label">Flexibilidade</span><Chips value={f.flexibilityDays} onChange={(v) => up("flexibilityDays", v)} options={[{ v: 0, l: "Exata" }, { v: 1, l: "±1" }, { v: 3, l: "±3" }, { v: 7, l: "±7" }]} /></div>
        </div>
        <div><span className="label">Bagagem</span><Chips value={f.baggage} onChange={(v) => up("baggage", v)} options={[{ v: "none", l: "Sem mala" }, { v: "carry_on", l: "De mão" }, { v: "checked", l: "Despachada" }]} /></div>
        <div className="hair grid gap-5 pt-8 sm:grid-cols-2">
          <Toggle checked={f.acceptsAlternativeAirports} onChange={(v) => up("acceptsAlternativeAirports", v)} label="Aeroportos alternativos" />
          <Toggle checked={f.acceptsSplitTicket} onChange={(v) => up("acceptsSplitTicket", v)} label="Bilhetes separados" />
          <Toggle checked={f.acceptsMultimodal} onChange={(v) => up("acceptsMultimodal", v)} label="Trem / ônibus / ferry" />
          <Toggle checked={f.acceptsAggressiveRoutes} onChange={(v) => up("acceptsAggressiveRoutes", v)} label="Rotas agressivas" />
        </div>
        <button onClick={go} disabled={loading} className="btn">{loading ? "Buscando…" : "Buscar voos"}</button>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-12 w-2/3 animate-pulse rounded bg-line" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-line" />
        </div>
      )}
      {advanced && data?.strategies && (
        <div className="hair pt-8">
          <Eyebrow>Estratégias</Eyebrow>
          <div className="mt-3 text-sm text-ink-soft">
            {data.strategies.map((s: any) => (
              <span key={s.key} className={s.available ? "text-ink" : "text-ink-faint"}>
                {s.label}
                {s.note ? ` (${s.note})` : ""}
                {"   "}
              </span>
            ))}
          </div>
        </div>
      )}
      {data && !loading && <ResultView data={data} />}
    </div>
  );
}
