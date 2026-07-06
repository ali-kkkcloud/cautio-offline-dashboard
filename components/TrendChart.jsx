"use client";

import { useEffect, useState } from "react";

const WIDTH = 320;
const HEIGHT = 150;
const PAD_L = 32;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 20;

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
      <div className="rounded-xl border border-border bg-panel p-3">
        <h3 className="mb-2 text-xs font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <div className="h-[150px] animate-pulse rounded-lg bg-panel2" />
      </div>
    );
  }

  if (!trend?.configured) {
    return (
      <div className="rounded-xl border border-border bg-panel p-3">
        <h3 className="mb-2 text-xs font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-[10px] leading-snug text-amber-200">
          History logging isn't set up yet — see README (History sheet).
        </div>
      </div>
    );
  }

  const known = trend.points.filter((p) => p.count !== null);

  if (known.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-panel p-3">
        <h3 className="mb-2 text-xs font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <p className="text-[10px] text-slate-500">No snapshots recorded yet today.</p>
      </div>
    );
  }

  if (known.length === 1) {
    return (
      <div className="rounded-xl border border-border bg-panel p-3">
        <h3 className="mb-2 text-xs font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
        <p className="text-[10px] text-slate-500">
          Recording started ({known[0].label}): <b className="text-slate-200">{known[0].count}</b>
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

  const gridLines = 3;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / gridLines);

  return (
    <div className="rounded-xl border border-border bg-panel p-3">
      <h3 className="mb-2 text-xs font-semibold text-slate-200">Offline Trend (Last 7 Days)</h3>
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
          <text key={i} x={PAD_L - 6} y={yFor(v) + 3} textAnchor="end" fontSize="8" fill="#64748b">
            {Math.round(v).toLocaleString("en-IN")}
          </text>
        ))}

        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke="#f87171" strokeWidth="1.8" />

        {known.map((p, i) => (
          <g key={p.label + i}>
            <circle cx={xFor(i)} cy={yFor(p.count)} r="2.5" fill="#f87171" stroke="#0a1120" strokeWidth="1" />
            <text x={xFor(i)} y={yFor(p.count) - 7} textAnchor="middle" fontSize="8" fontWeight="600" fill="#e2e8f0">
              {p.count.toLocaleString("en-IN")}
            </text>
            <text x={xFor(i)} y={HEIGHT - 4} textAnchor="middle" fontSize="7.5" fill="#64748b">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
