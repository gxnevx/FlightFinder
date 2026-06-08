"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import SourceGrid from "@/components/SourceGrid";

const actions = [
  { href: "/search", title: "Buscar voo", desc: "Ida e volta, multi-fonte, consenso em BRL", icon: "🔎" },
  { href: "/lucky", title: "Estou com sorte", desc: "Destino aberto, caça-pérolas com deal score", icon: "🎲" },
  { href: "/advanced", title: "Busca avançada", desc: "Datas flexíveis, aeroportos, estratégias", icon: "🛰" },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="pt-8 text-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="pill border border-white/10 bg-white/5 text-white/70">cockpit de viagem · BRL · pt-BR</span>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-gradient sm:text-6xl">
            Ache o voo certo, com prova e consenso
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/60">
            Cruzo várias fontes ao vivo, converto tudo para reais com IOF e mostro a melhor opção sem pegadinha
            e a mais agressiva, com nível de confiança, visto e clima.
          </p>
        </motion.div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {actions.map((a, i) => (
          <motion.div key={a.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
            <Link href={a.href} className="glass group block h-full p-6 transition duration-300 hover:-translate-y-1 hover:glow-accent">
              <div className="text-3xl animate-floaty">{a.icon}</div>
              <div className="mt-4 text-lg font-semibold text-white">{a.title}</div>
              <div className="mt-1 text-sm text-white/55">{a.desc}</div>
              <div className="mt-4 text-sm text-cockpit-accent opacity-0 transition group-hover:opacity-100">abrir →</div>
            </Link>
          </motion.div>
        ))}
      </section>

      <section>
        <SourceGrid />
      </section>
    </div>
  );
}
