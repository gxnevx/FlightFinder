"use client";

import { useEffect, useState } from "react";
import DataQualityBadge from "@/components/DataQualityBadge";
import type { SourceStatus } from "@/lib/types";

const definitions = [
  { title: "Datas flexíveis", source: "flight-worker", fallback: "needs_api", note: "Matriz de datas depende do worker." },
  { title: "Aeroportos alternativos", source: "flight-worker", fallback: "needs_api", note: "Preços alternativos dependem do worker." },
  { title: "Milhas", source: "seats-aero", fallback: "needs_api", note: "Compara resgates quando seats.aero está configurado." },
  { title: "Destino aberto", source: "travelpayouts", fallback: "needs_api", note: "Descoberta via cache, sempre exige validação live." },
  { title: "Split ticket", fallback: "roadmap", note: "Ainda não implementado." },
  { title: "Multimodal", fallback: "roadmap", note: "Ainda não implementado." },
];

export default function StrategyGrid() {
  const [sources, setSources] = useState<SourceStatus[]>([]);
  useEffect(() => { fetch("/api/sources").then((r) => r.json()).then((d) => setSources(d.sources || [])).catch(() => {}); }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {definitions.map((strategy) => {
        const source = sources.find((item) => item.key === strategy.source);
        const active = source?.state === "ativa";
        return (
          <article key={strategy.title} className="glass p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">{strategy.title}</h2>
              {source ? <DataQualityBadge quality={source.dataQuality} /> : <span className="text-xs text-ink-faint">{strategy.fallback}</span>}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-faint">{active ? source?.note : strategy.note}</p>
          </article>
        );
      })}
    </div>
  );
}
