"use client";

import { useEffect, useState } from "react";

const defaults = ["Consultando fontes configuradas", "Comparando preços", "Validando qualidade do dado"];

export default function AgentProgressLoader({ stages = defaults }: { stages?: string[] }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStage((value) => Math.min(stages.length - 1, value + 1)), 550);
    return () => window.clearInterval(timer);
  }, [stages.length]);

  return (
    <div className="glass p-5" role="status" aria-live="polite">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium text-ink">Analisando oportunidades</span>
        <span className="text-ink-faint">{stage + 1}/{stages.length}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-ink transition-all duration-500" style={{ width: `${((stage + 1) / stages.length) * 100}%` }} />
      </div>
      <p className="mt-3 text-sm text-ink-soft">{stages[stage]}</p>
    </div>
  );
}
