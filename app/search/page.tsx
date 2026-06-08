"use client";

import SearchForm from "@/components/SearchForm";
import { Eyebrow } from "@/components/ui";

export default function SearchPage() {
  return (
    <div className="space-y-12 pt-16">
      <div>
        <Eyebrow>Busca</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Para onde vamos?</h1>
      </div>
      <SearchForm endpoint="/api/search" />
    </div>
  );
}
