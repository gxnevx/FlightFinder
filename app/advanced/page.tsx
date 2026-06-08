"use client";

import SearchForm from "@/components/SearchForm";
import { SectionTitle } from "@/components/ui";

export default function AdvancedPage() {
  return (
    <div className="space-y-6">
      <SectionTitle kicker="modo impecável" title="Busca avançada e estratégias" />
      <p className="-mt-2 text-sm text-white/55">
        Datas flexíveis e aeroportos alternativos já entram no consenso. Split ticket, hidden city (apenas alerta),
        multimodal e milhas aparecem como roadmap nas estratégias abaixo.
      </p>
      <SearchForm endpoint="/api/advanced-search" advanced />
    </div>
  );
}
