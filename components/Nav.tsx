"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/search", label: "Buscar" },
  { href: "/lucky", label: "Estou com sorte" },
  { href: "/advanced", label: "Avançado" },
  { href: "/evals", label: "Evals" },
  { href: "/history", label: "Histórico" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-[15px] font-semibold tracking-tightest text-ink">
          FlightFinder
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "text-ink underline decoration-ink/30 underline-offset-4" : "text-ink-faint transition hover:text-ink"}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
