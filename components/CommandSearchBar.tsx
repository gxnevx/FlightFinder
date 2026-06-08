"use client";

import { useState } from "react";
import { parseFlightQuery, type ParsedFlightQuery } from "@/lib/query-parser";

export const QUERY_EXAMPLES = [
  "são paulo para lisboa em setembro, 5 dias",
  "me ache europa barata em outubro",
  "fim de semana barato saindo de sp",
];

export default function CommandSearchBar({ onInterpret }: { onInterpret: (parsed: ParsedFlightQuery) => void }) {
  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState<ParsedFlightQuery | null>(null);

  function interpret(value = query) {
    const result = parseFlightQuery(value);
    setQuery(value);
    setParsed(result);
    onInterpret(result);
  }

  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Descreva a viagem"
          className="field flex-1 bg-white"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && interpret()}
          placeholder="São Paulo para Lisboa em setembro, 5 dias"
        />
        <button className="btn" onClick={() => interpret()} disabled={!query.trim()}>Interpretar</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {QUERY_EXAMPLES.map((example) => (
          <button key={example} className="chip border-line text-left text-ink-soft hover:border-ink/30" onClick={() => interpret(example)}>
            {example}
          </button>
        ))}
      </div>
      {parsed && (
        <div className="mt-5 border-t border-line pt-4 text-sm">
          {parsed.understood.length > 0 && <p className="text-ink">Entendi: {parsed.understood.join(" · ")}</p>}
          {parsed.missing.length > 0 && <p className="mt-2 text-signal-warn">Complete no formulário: {parsed.missing.join(", ")}.</p>}
        </div>
      )}
    </div>
  );
}
