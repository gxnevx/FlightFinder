"use client";

import { useRouter } from "next/navigation";
import CommandSearchBar from "@/components/CommandSearchBar";
import RouteCanvas from "@/components/RouteCanvas";

export default function HomeHero() {
  const router = useRouter();
  return (
    <section className="grid items-center gap-10 pt-20 sm:pt-28 lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <div className="label">FlightFinder · busca honesta</div>
        <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tightest text-ink sm:text-7xl">
          Encontre boas rotas sem esconder a qualidade do dado.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed">
          Descreva a viagem. O agente interpreta origem, destino e datas, consulta as fontes configuradas e mostra onde ainda falta validação.
        </p>
        <div className="mt-8">
          <CommandSearchBar onInterpret={(parsed) => {
            const params = new URLSearchParams();
            Object.entries(parsed.request).forEach(([key, value]) => value != null && params.set(key, String(value)));
            router.push(`/search?${params}`);
          }} />
        </div>
      </div>
      <RouteCanvas />
    </section>
  );
}
