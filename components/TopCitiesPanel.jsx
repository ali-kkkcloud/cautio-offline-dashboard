"use client";

const SEVERITY_BAR = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-amber-300",
  low: "bg-sky-400",
};

export default function TopCitiesPanel({ cities = [], limit = 5 }) {
  const top = cities.slice(0, limit);
  const max = top.length > 0 ? top[0].count : 1;

  return (
    <div className="rounded-xl border border-border bg-panel p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Top Affected Cities</h3>
        <span className="text-[11px] text-slate-500">Vehicles</span>
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-slate-500">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {top.map((c) => {
            const widthPct = Math.max(4, (c.count / max) * 100);
            return (
              <div key={c.city} className="flex items-center gap-2">
                <div className="w-16 shrink-0 truncate text-[11px] text-slate-300">{c.city}</div>
                <div className="h-3.5 flex-1 overflow-hidden rounded bg-panel2">
                  <div
                    className={`h-full rounded ${SEVERITY_BAR[c.severity] || "bg-slate-500"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="w-9 shrink-0 text-right text-[11px] font-semibold text-slate-200">
                  {c.count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
