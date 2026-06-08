import type { DataQuality } from "@/lib/types";

const styles: Record<DataQuality, string> = {
  live: "border-signal-good/30 bg-signal-good/10 text-signal-good",
  cache: "border-signal-warn/30 bg-signal-warn/10 text-signal-warn",
  demo: "border-ink-faint/30 bg-ink-faint/10 text-ink-soft",
  hypothesis: "border-ink-faint/30 bg-ink-faint/10 text-ink-soft",
  manual_validation_required: "border-signal-warn/30 bg-signal-warn/10 text-signal-warn",
  unavailable: "border-line bg-white/40 text-ink-faint",
};

export default function DataQualityBadge({ quality }: { quality: DataQuality }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[quality]}`}>
      {quality}
    </span>
  );
}
