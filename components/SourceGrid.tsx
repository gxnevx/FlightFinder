"use client";

import { useEffect, useState } from "react";
import { Badge, SectionTitle } from "@/components/ui";

const tone = (s: string) =>
  s === "ativa" ? "good" : s === "sem-chave" ? "warn" : s === "mock" ? "info" : s === "fallback" ? "warn" : "bad";

export default function SourceGrid() {
  const [src, setSrc] = useState<any[]>([]);
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((d) => setSrc(d.sources || []))
      .catch(() => setErr(true));
  }, []);

  return (
    <div className="glass p-6">
      <SectionTitle kicker="tempo real" title="Status das fontes" />
      {err && <p className="text-sm text-white/50">não foi possível carregar o status.</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {src.map((s) => (
          <div key={s.key} className="glass-soft flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{s.label}</div>
              <div className="truncate text-xs text-white/45">{s.note}</div>
            </div>
            <Badge tone={tone(s.state) as any}>{s.state}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
