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

export default function ClientCard({ name, count, severity, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border border-border bg-panel px-3 py-2 text-left transition-colors hover:bg-panel2 ${SEVERITY_RING[severity] || ""}`}
    >
      <div className="truncate text-xs text-slate-300">{name}</div>
      <div className={`mt-0.5 text-xl font-semibold leading-tight ${SEVERITY_TEXT[severity] || "text-white"}`}>
        {count.toLocaleString("en-IN")}
      </div>
    </button>
  );
}
