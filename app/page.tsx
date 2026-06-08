"use client";

import Link from "next/link";
import SourceGrid from "@/components/SourceGrid";
import { Eyebrow } from "@/components/ui";

export default function Home() {
  return (
    <div className="space-y-24">
      <section className="pt-20 sm:pt-28">
        <div className="rise max-w-3xl">
          <Eyebrow>Busca de voos · consenso · reais</Eyebrow>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tightest text-ink sm:text-7xl">
            Voe melhor.
            <br />
            Pague o preço justo.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
            Cruzo várias fontes ao vivo, converto tudo para reais com IOF e mostro a melhor opção sem pegadinha
            e a mais agressiva, com nível de confiança, visto e clima.
          </p>
          <div className="mt-9 flex items-center gap-7">
            <Link href="/search" className="btn">Buscar voos</Link>
            <Link href="/lucky" className="btn-line">Estou com sorte</Link>
          </div>
        </div>
      </section>

      <section className="hair pt-16">
        <SourceGrid />
      </section>
    </div>
  );
}
