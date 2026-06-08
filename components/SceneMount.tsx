"use client";

import dynamic from "next/dynamic";

// Carrega o WebGL só no cliente (ssr:false) para não quebrar o build/SSR.
const Background3D = dynamic(() => import("@/components/Background3D"), { ssr: false });

export default function SceneMount() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 opacity-80">
        <Background3D />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060912]" />
    </div>
  );
}
