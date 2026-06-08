"use client";

import { useState } from "react";
import SearchForm from "@/components/SearchForm";
import StrategyGrid from "@/components/StrategyGrid";
import { Eyebrow } from "@/components/ui";

export default function AdvancedPage() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="space-y-12 pt-16">
      <header>
        <Eyebrow>Busca avançada</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Estratégias disponíveis, sem fingir capacidade.</h1>
        <p className="mt-5 max-w-2xl">Cada estratégia mostra seu estado real conforme as integrações configuradas. Itens de roadmap não aparecem como ativos.</p>
      </header>
      <StrategyGrid />
      <button className="btn" onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar busca" : "Configurar busca avançada"}</button>
      {showForm && <SearchForm endpoint="/api/advanced-search" advanced />}
    </div>
  );
}
