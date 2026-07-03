export default function StatCard({ label, value }) {
  return (
    <div className="card-glow rounded-xl border border-border px-5 py-4 shadow-glow">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-white">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </div>
    </div>
  );
}
