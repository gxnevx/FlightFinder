"use client";

import { useEffect, useState, type ReactNode } from "react";
import ResultView from "@/components/ResultView";
import AgentProgressLoader from "@/components/AgentProgressLoader";
import { Eyebrow, Toggle } from "@/components/ui";
import type { SearchRequest } from "@/lib/types";

const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

interface ChipOption { v: string | number; l: string }
function Chips({ options, value, onChange }: { options: ChipOption[]; value: unknown; onChange: (value: any) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={String(option.v)}
          type="button"
          onClick={() => onChange(option.v)}
          className={`chip ${value === option.v ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"}`}
        >
          {option.l}
        </button>
      ))}
    </div>
  );
}

const defaults: SearchRequest = {
  origin: "GRU",
  destination: "LIS",
  departureDate: future(90),
  returnDate: future(97),
  passengers: 1,
  cabin: "economy",
  flexibilityDays: 0,
  baggage: "carry_on",
  acceptsAlternativeAirports: true,
};

export default function SearchForm({ endpoint, advanced = false, initialRequest }: {
  endpoint: string;
  advanced?: boolean;
  initialRequest?: Partial<SearchRequest>;
}) {
  const [form, setForm] = useState<SearchRequest>({ ...defaults, ...initialRequest });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (initialRequest) setForm((current) => ({ ...current, ...initialRequest }));
  }, [initialRequest]);

  const update = (key: keyof SearchRequest, value: any) => setForm((current) => ({ ...current, [key]: value }));

  async function search() {
    setLoading(true);
    setData(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setData(await response.json());
    } catch {
      setData({ error: "falha na busca" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-14">
      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Origem"><input className="field" value={form.origin} onChange={(event) => update("origin", event.target.value.toUpperCase())} /></Field>
          <Field label="Destino"><input className="field" value={form.destination} onChange={(event) => update("destination", event.target.value.toUpperCase())} /></Field>
          <Field label="Ida"><input type="date" className="field" value={form.departureDate} onChange={(event) => update("departureDate", event.target.value)} /></Field>
          <Field label="Volta"><input type="date" className="field" value={form.returnDate || ""} onChange={(event) => update("returnDate", event.target.value)} /></Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Passageiros"><input type="number" min={1} className="field" value={form.passengers} onChange={(event) => update("passengers", +event.target.value)} /></Field>
          <div><span className="label">Cabine</span><Chips value={form.cabin} onChange={(value) => update("cabin", value)} options={[{ v: "economy", l: "Econômica" }, { v: "premium", l: "Premium" }, { v: "business", l: "Executiva" }, { v: "first", l: "Primeira" }]} /></div>
          <div><span className="label">Flexibilidade</span><Chips value={form.flexibilityDays} onChange={(value) => update("flexibilityDays", value)} options={[{ v: 0, l: "Exata" }, { v: 1, l: "±1" }, { v: 3, l: "±3" }, { v: 7, l: "±7" }]} /></div>
        </div>

        <div><span className="label">Bagagem</span><Chips value={form.baggage} onChange={(value) => update("baggage", value)} options={[{ v: "none", l: "Sem mala" }, { v: "carry_on", l: "De mão" }, { v: "checked", l: "Despachada" }]} /></div>
        <div className="hair pt-8">
          <Toggle checked={Boolean(form.acceptsAlternativeAirports)} onChange={(value) => update("acceptsAlternativeAirports", value)} label="Considerar aeroportos próximos" />
          <p className="mt-3 text-xs text-ink-faint">Estratégias ainda não implementadas nunca aparecem como resultado ativo.</p>
        </div>
        <button onClick={search} disabled={loading} className="btn">{loading ? "Buscando…" : "Buscar voos"}</button>
      </div>

      {loading && <AgentProgressLoader />}
      {advanced && data?.strategies && (
        <div className="hair pt-8">
          <Eyebrow>Estratégias consultadas</Eyebrow>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.strategies.map((strategy: any) => (
              <div key={strategy.key} className="rounded-xl border border-line bg-white/45 p-4 text-sm">
                <div className="font-medium text-ink">{strategy.label}</div>
                <div className="mt-1 text-ink-faint">{strategy.available ? "ativo" : strategy.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data && !loading && <ResultView data={data} />}
    </div>
  );
}
