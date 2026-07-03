"use client";

import { useMemo } from "react";
import { getCityCoordinates } from "../lib/cityCoordinates";
import { makeProjector, outlineToPath } from "../lib/indiaOutline";

const SEVERITY_COLOR = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#38bdf8",
};

const WIDTH = 520;
const HEIGHT = 480;

export default function IndiaMap({ cities = [] }) {
  const project = useMemo(() => makeProjector({ width: WIDTH, height: HEIGHT, padding: 24 }), []);
  const outlinePath = useMemo(() => outlineToPath(project), [project]);

  const markers = useMemo(() => {
    return cities
      .map((c) => {
        const coords = getCityCoordinates(c.city);
        if (!coords) return null;
        const [x, y] = project(coords[0], coords[1]);
        return { ...c, x, y };
      })
      .filter(Boolean);
  }, [cities, project]);

  const citiesImpacted = cities.length;

  return (
    <div className="relative rounded-xl border border-border bg-panel p-4">
      <div className="pointer-events-none absolute right-4 top-4 z-10 w-44 rounded-lg border border-border bg-panel2/90 px-3 py-2 text-[11px] leading-5 text-slate-300 backdrop-blur">
        <div><span className="text-red-400">Red</span> = Critical (&gt;100)</div>
        <div><span className="text-orange-300">Orange</span> = High (50-100)</div>
        <div><span className="text-sky-400">Blue</span> = Normal (&lt;50)</div>
      </div>

      {citiesImpacted > 0 && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-lg border border-border bg-panel2/90 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
          <div className="font-semibold text-slate-200">
            ALERT: {citiesImpacted} {citiesImpacted === 1 ? "City" : "Cities"} Impacted
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[420px] w-full">
        <path d={outlinePath} fill="#111c30" stroke="#2a3a55" strokeWidth="1.5" />
        {markers.map((m) => (
          <g key={m.city}>
            <circle
              cx={m.x}
              cy={m.y}
              r={Math.min(14, 6 + Math.sqrt(m.count))}
              fill={SEVERITY_COLOR[m.severity]}
              fillOpacity="0.25"
            />
            <circle cx={m.x} cy={m.y} r="5" fill={SEVERITY_COLOR[m.severity]} />
            <text
              x={m.x + 9}
              y={m.y + 4}
              fontSize="11"
              fill="#cbd5e1"
              style={{ paintOrder: "stroke", stroke: "#0a1120", strokeWidth: 3 }}
            >
              {m.city}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
