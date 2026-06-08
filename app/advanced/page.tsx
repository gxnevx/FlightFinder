"use client";

import SearchForm from "@/components/SearchForm";
import { Eyebrow } from "@/components/ui";

export default function AdvancedPage() {
  return (
    <div className="space-y-12 pt-16">
      <div>
        <Eyebrow>Busca avançada</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Estratégias e flexibilidade</h1>
        <p className="mt-5 max-w-xl text-ink-soft">
          Datas flexíveis e aeroportos alternativos entram no consenso. Split ticket, hidden city, multimodal e milhas
          são roadmap.
        </p>
      </div>
      <SearchForm endpoint="/api/advanced-search" advanced />
    </div>
  );
}
