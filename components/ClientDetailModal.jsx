"use client";

export default function ClientDetailModal({ client, onClose }) {
  if (!client) return null;

  const byCity = {};
  for (const v of client.vehicles || []) {
    const key = v.city || "Unknown";
    if (!byCity[key]) byCity[key] = [];
    byCity[key].push(v);
  }
  const cityEntries = Object.entries(byCity).sort((a, b) => b[1].length - a[1].length);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{client.name}</h3>
            <p className="text-sm text-slate-400">
              {client.count} offline vehicles across {client.cities.length}{" "}
              {client.cities.length === 1 ? "city" : "cities"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1 text-sm text-slate-300 hover:bg-panel2"
          >
            Close
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
          {cityEntries.map(([city, vehicles]) => (
            <div key={city} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">{city}</h4>
                <span className="text-xs text-slate-500">
                  {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicles.map((v, i) => (
                  <span
                    key={`${v.vehicle}-${i}`}
                    title={`${v.hoursOffline}h offline`}
                    className="rounded-md border border-border bg-panel2 px-2 py-1 text-xs text-slate-300"
                  >
                    {v.vehicle}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {cityEntries.length === 0 && (
            <p className="text-sm text-slate-500">No vehicle details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
