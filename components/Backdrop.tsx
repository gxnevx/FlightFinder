// Fundo experimental, claro e sutil: mesh de gradiente que respira + grid de
// laboratório, sem WebGL. Fica fixo atrás de tudo e não captura cliques.
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-paper" />
      <div
        className="blob absolute -left-32 -top-40 h-[42rem] w-[42rem] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.16), transparent)" }}
      />
      <div
        className="blob-2 absolute -right-40 top-10 h-[40rem] w-[40rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(244,164,96,0.16), transparent)" }}
      />
      <div
        className="blob absolute bottom-[-20rem] left-1/3 h-[44rem] w-[44rem] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(63,111,82,0.12), transparent)" }}
      />
      <div className="grid-overlay absolute inset-0" />
    </div>
  );
}
