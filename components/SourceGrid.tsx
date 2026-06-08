"use client";

import { useEffect, useState } from "react";
import { Dot, Eyebrow } from "@/components/ui";

const tone = (s: string) => (s === "ativa" ? "good" : s === "indisponível" ? "bad" : "warn");

export default function SourceGrid() {
  const [src, setSrc] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/sources").then((r) => r.json()).then((d) => setSrc(d.sources || [])).catch(() => {});
  }, []);
  return (
    <div>
      <Eyebrow>Fontes · tempo real</Eyebrow>
      <div className="mt-6 divide-y divide-line">
        {src.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-4 py-3.5">
            <div className="text-[15px] text-ink">{s.label}</div>
            <div className="flex items-center gap-5">
              <span className="hidden max-w-xs truncate text-xs text-ink-faint sm:block">{s.note}</span>
              <Dot tone={tone(s.state) as any}>{s.state}</Dot>
            </div>
          </div>
        ))}
        {src.length === 0 && <div className="py-3.5 text-sm text-ink-faint">carregando…</div>}
      </div>
    </div>
  );
}
