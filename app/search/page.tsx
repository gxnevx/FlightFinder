"use client";

import SearchForm from "@/components/SearchForm";
import { SectionTitle } from "@/components/ui";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <SectionTitle kicker="busca normal" title="Buscar voo (ida e volta)" />
      <SearchForm endpoint="/api/search" />
    </div>
  );
}
