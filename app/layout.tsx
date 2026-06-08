import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "FlightFinder",
  description: "Busca de voos multi-fonte com consenso de preço, em reais.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-6 pb-32">{children}</main>
        <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-ink-faint">
          FlightFinder · busca multi-fonte com consenso · valores em reais
        </footer>
      </body>
    </html>
  );
}
