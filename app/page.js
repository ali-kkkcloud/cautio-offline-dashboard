"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import StatCard from "../components/StatCard";
import ClientCard from "../components/ClientCard";
import IndiaMap from "../components/IndiaMap";

const FILTERS = [
  { key: "all", label: "ALL" },
  { key: "critical", label: "CRITICAL" },
  { key: "high", label: "HIGH" },
  { key: "medium", label: "MEDIUM" },
  { key: "low", label: "LOW" },
];

const FILTER_STYLES = {
  all: "bg-slate-600/30 text-slate-200 border-slate-500/40",
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  medium: "bg-amber-400/20 text-amber-200 border-amber-400/40",
  low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

export default function Page() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load data");
      setData(json);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredClients = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.clients;
    return data.clients.filter((c) => c.severity === filter);
  }, [data, filter]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ["Client", "Offline Vehicles", "Severity", "Cities"],
      ...data.clients.map((c) => [c.name, c.count, c.severity, c.cities.join(" | ")]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vehicles-offline-48h-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Vehicles Offline &gt; {data?.offlineHoursThreshold ?? 48} Hours
          </h1>
          <p className="mt-1 text-sm text-slate-400">Fleet Operations Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-slate-300">
            {data?.offlineHoursThreshold ?? 48}h+ Offline Window
          </div>
          <button
            onClick={load}
            className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-slate-200 hover:bg-panel2"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
          <button
            onClick={handleExport}
            disabled={!data}
            className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-slate-200 hover:bg-panel2 disabled:opacity-40"
          >
            ⬇ Export
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        <div>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Offline Vehicles" value={data?.stats.totalOfflineVehicles ?? "—"} />
            <StatCard label="Total Clients" value={data?.stats.totalClients ?? "—"} />
            <StatCard label="Critical Clients" value={data?.stats.criticalClients ?? "—"} />
            <StatCard label="Cities Affected" value={data?.stats.citiesAffected ?? "—"} />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Clients</h2>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-opacity ${FILTER_STYLES[f.key]} ${
                    filter === f.key ? "opacity-100 ring-1 ring-white/30" : "opacity-60 hover:opacity-90"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading && !data ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-[74px] animate-pulse rounded-xl border border-border bg-panel" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {filteredClients.map((c) => (
                <ClientCard key={c.name} name={c.name} count={c.count} severity={c.severity} />
              ))}
              {filteredClients.length === 0 && (
                <div className="col-span-full rounded-xl border border-border bg-panel px-4 py-6 text-center text-sm text-slate-400">
                  No clients in this severity band right now.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <IndiaMap cities={data?.cities ?? []} />

          <div className="rounded-xl border border-border bg-panel p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Top Clients Needing Attention
            </h3>
            <div className="space-y-2">
              {(data?.clients ?? []).slice(0, 5).map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-lg border border-border bg-panel2 px-3 py-2"
                >
                  <div>
                    <div className="text-sm text-slate-200">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {c.cities.slice(0, 2).join(", ")}
                      {c.cities.length > 2 ? ` +${c.cities.length - 2} more` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${FILTER_STYLES[c.severity]}`}
                    >
                      {c.severity.toUpperCase()}
                    </span>
                    <span className="text-lg font-semibold text-white">{c.count}</span>
                  </div>
                </div>
              ))}
              {(!data || data.clients.length === 0) && (
                <div className="text-sm text-slate-500">No data yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-600">
        {updatedAt ? `Last updated ${updatedAt.toLocaleString("en-IN")}` : ""}
      </div>
    </main>
  );
}
