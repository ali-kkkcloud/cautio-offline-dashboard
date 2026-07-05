"use client";

import { useEffect, useState } from "react";

const WIDTH = 600;
const HEIGHT = 220;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 28;
const PAD_B = 28;

export default function TrendChart() {
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trend", { cache: "no-store" })
      .then((res) => res.json())
      .then(setTrend)
      .catch(() => setTrend({ configured: false, points: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-panel p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <div className="h-[220px] animate-pulse rounded-lg bg-panel2" />
      </div>
    );
  }

  if (!trend?.configured) {
    return (
      <div className="rounded-xl border border-border bg-panel p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          History sheet abhi read nahi ho pa rahi. Check karo ki dusri sheet
          "Anyone with the link – Viewer" se share hai, aur{" "}
          <code>HISTORY_SHEET_ID</code> sahi hai.
        </div>
      </div>
    );
  }

  const known = trend.points.filter((p) => p.count !== null);

  if (known.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-panel p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <p className="text-xs text-slate-500">
          History sheet connect ho gayi hai, par abhi tak koi snapshot record nahi hua. Aaj raat 11
          PM ke baad pehla data point aa jaayega.
        </p>
      </div>
    );
  }

  if (known.length === 1) {
    return (
      <div className="rounded-xl border border-border bg-panel p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <p className="text-xs text-slate-500">
          Recording started ({known[0].label}): <b className="text-slate-200">{known[0].count}</b>{" "}
          offline vehicles. Kuch aur din record hone ke baad trend line dikhegi.
        </p>
      </div>
    );
  }

  const counts = known.map((p) => p.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const yMax = max === min ? max + 10 : max + (max - min) * 0.15;
  const yMin = max === min ? Math.max(0, min - 10) : Math.max(0, min - (max - min) * 0.15);

  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;

  const xFor = (i) => PAD_L + (known.length === 1 ? innerW / 2 : (i / (known.length - 1)) * innerW);
  const yFor = (v) => PAD_T + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const linePath = known.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(p.count).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${xFor(known.length - 1).toFixed(1)},${PAD_T + innerH} L${xFor(0).toFixed(1)},${PAD_T + innerH} Z`;

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / gridLines);

  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridValues.map((v, i) => (
          <line key={i} x1={PAD_L} x2={WIDTH - PAD_R} y1={yFor(v)} y2={yFor(v)} stroke="#1e2a40" strokeWidth="1" />
        ))}
        {gridValues.map((v, i) => (
          <text key={i} x={PAD_L - 8} y={yFor(v) + 4} textAnchor="end" fontSize="10" fill="#64748b">
            {Math.round(v).toLocaleString("en-IN")}
          </text>
        ))}

        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke="#f87171" strokeWidth="2" />

        {known.map((p, i) => (
          <g key={p.label + i}>
            <circle cx={xFor(i)} cy={yFor(p.count)} r="3.5" fill="#f87171" stroke="#0a1120" strokeWidth="1.5" />
            <text x={xFor(i)} y={yFor(p.count) - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#e2e8f0">
              {p.count.toLocaleString("en-IN")}
            </text>
            <text x={xFor(i)} y={HEIGHT - 6} textAnchor="middle" fontSize="10" fill="#64748b">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
