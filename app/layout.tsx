import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import SceneMount from "@/components/SceneMount";

export const metadata: Metadata = {
  title: "FlightFinder — busca de voos multi-fonte (BRL)",
  description:
    "Cockpit de busca de voos com modo consenso: cruza várias fontes, converte para BRL e mostra confiança, visto e clima.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <SceneMount />
        <Nav />
        <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-28 pt-28">{children}</main>
      </body>
    </html>
  );
}
