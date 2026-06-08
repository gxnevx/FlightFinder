import HomeHero from "@/components/HomeHero";
import SourceGrid from "@/components/SourceGrid";
import { Eyebrow } from "@/components/ui";

export default function Home() {
  return (
    <div className="space-y-24">
      <HomeHero />
      <section className="hair pt-14">
        <Eyebrow>Fontes e disponibilidade reais</Eyebrow>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
          O painel abaixo vem de <code>/api/sources</code>. Fontes sem chave ou experimentais não contam como consenso.
        </p>
        <div className="mt-8"><SourceGrid /></div>
      </section>
    </div>
  );
}
