"use client";

import Link from "next/link";
import Marquee from "@/components/Marquee";
import SourceGrid from "@/components/SourceGrid";
import { Kinetic, Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";

export default function Home() {
  return (
    <div className="space-y-24">
      <section className="pt-20 sm:pt-28">
        <Eyebrow>Busca de voos · consenso · reais</Eyebrow>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tightest text-ink sm:text-7xl">
          <Kinetic text="Voe melhor." />
          <br />
          <Kinetic text="Pague o preço justo." />
        </h1>
        <Reveal delay={0.55}>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
            Cruzo várias fontes ao vivo, converto tudo para reais com IOF e mostro a melhor opção sem pegadinha
            e a mais agressiva, com nível de confiança, visto e clima.
          </p>
          <div className="mt-9 flex items-center gap-7">
            <Link href="/search" className="btn">Buscar voos</Link>
            <Link href="/lucky" className="btn-line">Estou com sorte</Link>
          </div>
        </Reveal>
      </section>

      <Reveal className="hair">
        <Marquee />
      </Reveal>

      <Reveal className="hair pt-16">
        <SourceGrid />
      </Reveal>
    </div>
  );
}
