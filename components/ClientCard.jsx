const SEVERITY_RING = {
  critical: "ring-1 ring-red-500/40",
  high: "ring-1 ring-orange-400/30",
  medium: "ring-1 ring-amber-300/20",
  low: "ring-1 ring-emerald-400/20",
};

const SEVERITY_TEXT = {
  critical: "text-red-400",
  high: "text-orange-300",
  medium: "text-amber-200",
  low: "text-emerald-300",
};

export default function ClientCard({ name, count, severity }) {
  return (
    <div
      className={`rounded-xl border border-border bg-panel px-4 py-3 hover:bg-panel2 transition-colors ${SEVERITY_RING[severity] || ""}`}
    >
      <div className="truncate text-sm text-slate-300">{name}</div>
      <div className={`mt-1 text-2xl font-semibold ${SEVERITY_TEXT[severity] || "text-white"}`}>
        {count.toLocaleString("en-IN")}
      </div>
    </div>
  );
}
