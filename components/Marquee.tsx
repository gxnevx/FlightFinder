"use client";

const ITEMS = [
  "GRU → LIS", "CGH → EZE", "VCP → SCL", "GIG → MIA", "GRU → CDG",
  "BSB → JFK", "REC → LIS", "FOR → MAD", "POA → EZE", "GRU → NRT", "GIG → SCL",
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
        {row.map((r, i) => (
          <span key={i} className="text-sm tracking-tight text-ink-faint">{r}</span>
        ))}
      </div>
    </div>
  );
}
