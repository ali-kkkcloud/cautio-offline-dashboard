"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import StatCard from "../components/StatCard";
import ClientCard from "../components/ClientCard";
import ClientDetailModal from "../components/ClientDetailModal";
import TopCitiesPanel from "../components/TopCitiesPanel";
import TrendChart from "../components/TrendChart";

// Leaflet touches `window`, so it must never be rendered on the server.
const IndiaLeafletMap = dynamic(() => import("../components/IndiaLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] animate-pulse rounded-xl border border-border bg-panel" />
  ),
});

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
  const [selectedClient, setSelectedClient] = useState(null);

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
    <main className="mx-auto max-w-[1400px] px-6 py-4">
      {/* Header — logo sits inline next to the title, not stacked above it */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Plain <img>, not next/image — simpler & predictable for a small static asset */}
          <img src="/cautio-logo.png" alt="Cautio" className="h-8 w-auto shrink-0" />
          <div>
            <h1 className="text-2xl font-bold leading-tight text-white">
              Vehicles Offline &gt; {data?.offlineHoursThreshold ?? 48} Hours
            </h1>
            <p className="text-xs text-slate-400">Fleet Operations Overview</p>
          </div>
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
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_520px]">
        {/* Left column */}
        <div>
          {/* Stat cards — compact */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Offline Vehicles" value={data?.stats.totalOfflineVehicles ?? "—"} />
            <StatCard label="Total Clients" value={data?.stats.totalClients ?? "—"} />
            <StatCard label="Critical Clients" value={data?.stats.criticalClients ?? "—"} />
            <StatCard label="Cities Affected" value={data?.stats.citiesAffected ?? "—"} />
          </div>

          {/* Filters */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Clients{" "}
              <span className="text-xs font-normal text-slate-500">
                ({filteredClients.length})
              </span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-opacity ${FILTER_STYLES[f.key]} ${
                    filter === f.key ? "opacity-100 ring-1 ring-white/30" : "opacity-60 hover:opacity-90"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client grid — compact, more columns */}
          {loading && !data ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {Array.from({ length: 21 }).map((_, i) => (
                <div key={i} className="h-[58px] animate-pulse rounded-lg border border-border bg-panel" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {filteredClients.map((c) => (
                <ClientCard
                  key={c.name}
                  name={c.name}
                  count={c.count}
                  severity={c.severity}
                  onClick={() => setSelectedClient(c)}
                />
              ))}
              {filteredClients.length === 0 && (
                <div className="col-span-full rounded-xl border border-border bg-panel px-4 py-6 text-center text-sm text-slate-400">
                  No clients in this severity band right now.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: map on top, Trend + Top Cities side by side right below it */}
        <div className="space-y-3">
          <IndiaLeafletMap cities={data?.cities ?? []} />
          <div className="grid grid-cols-2 gap-3">
            <TrendChart />
            <TopCitiesPanel cities={data?.cities ?? []} limit={5} />
          </div>
        </div>
      </div>

      {/* Low-priority stuff, tucked out of the way at the very bottom */}
      <div className="mt-4 space-y-2">
        {data && data.stats.indeterminateCount > 0 && (
          <details className="rounded-lg border border-border bg-panel/60 px-4 py-2 text-xs text-slate-500">
            <summary className="cursor-pointer select-none">
              {data.stats.indeterminateCount} row(s) could not be classified as online/offline —
              click to see why
            </summary>
            <p className="mt-2 leading-relaxed">
              These rows had neither a usable "Offline Since (hrs)" number nor a parseable "Last
              Online" date (e.g. #N/A + "Offline" text). They were <b>not counted either way</b> so
              the numbers above stay accurate. Worth checking those rows manually in the sheet.
            </p>
          </details>
        )}

        <div className="text-center text-xs text-slate-600">
          {updatedAt ? `Last updated ${updatedAt.toLocaleString("en-IN")}` : ""}
          {" · "}Click any client card to see its vehicle numbers &amp; cities.
        </div>
      </div>

      <ClientDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} />
    </main>
  );
}
