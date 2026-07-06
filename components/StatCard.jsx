export default function StatCard({ label, value }) {
  return (
    <div className="card-glow rounded-lg border border-border px-3 py-2 shadow-glow">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-white">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </div>
    </div>
  );
}
