"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import CommandSearchBar from "@/components/CommandSearchBar";
import SearchForm from "@/components/SearchForm";
import { Eyebrow } from "@/components/ui";
import type { SearchRequest } from "@/lib/types";

function SearchExperience() {
  const params = useSearchParams();
  const fromUrl = Object.fromEntries(params.entries()) as Partial<SearchRequest>;
  const [request, setRequest] = useState<Partial<SearchRequest>>(fromUrl);
  const [showForm, setShowForm] = useState(Object.keys(fromUrl).length > 0);

  return (
    <div className="space-y-10 pt-16">
      <header>
        <Eyebrow>Busca por linguagem natural</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Descreva a viagem.</h1>
        <p className="mt-4 max-w-xl">A interpretação preenche parâmetros reais. O que não for entendido continua explícito no formulário técnico.</p>
      </header>
      <CommandSearchBar onInterpret={(parsed) => { setRequest(parsed.request); setShowForm(true); }} />
      {showForm && (
        <section className="hair pt-10">
          <SearchForm endpoint="/api/search" initialRequest={request} />
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-16 text-sm text-ink-faint">Carregando busca…</div>}>
      <SearchExperience />
    </Suspense>
  );
}
