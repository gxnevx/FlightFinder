"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Cockpit" },
  { href: "/search", label: "Buscar" },
  { href: "/lucky", label: "Estou com sorte" },
  { href: "/advanced", label: "Avançado" },
  { href: "/evals", label: "Evals" },
  { href: "/history", label: "Histórico" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4">
      <div className="glass flex items-center gap-0.5 rounded-full px-2 py-1.5">
        <span className="px-2 text-sm font-semibold tracking-tight text-gradient">✈ FlightFinder</span>
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className="relative rounded-full px-3 py-1.5 text-sm">
              {active && <motion.span layoutId="navpill" className="absolute inset-0 rounded-full bg-white/10 glow-accent" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className={`relative ${active ? "text-white" : "text-white/55 hover:text-white/85"}`}>{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
