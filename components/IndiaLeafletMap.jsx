"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.Default.css";
import { getCityCoordinates } from "../lib/cityCoordinates";

const SEVERITY_COLOR = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#38bdf8",
};

function makeIcon(color, size) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};opacity:0.9;
      box-shadow:0 0 0 4px ${color}33;
      border:2px solid #0a1120;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const total = markers.reduce((sum, m) => sum + (m.options.offlineCount || 0), 0);
  let color = SEVERITY_COLOR.low;
  if (total > 100) color = SEVERITY_COLOR.critical;
  else if (total >= 50) color = SEVERITY_COLOR.high;
  else if (total >= 20) color = SEVERITY_COLOR.medium;

  const size = Math.min(52, 30 + Math.sqrt(total) * 2);
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};opacity:0.92;display:flex;align-items:center;
      justify-content:center;color:#0a1120;font-weight:700;font-size:12px;
      border:2px solid #0a1120;box-shadow:0 0 0 4px ${color}33;
    ">${total}</div>`,
    className: "",
    iconSize: [size, size],
  });
}

const INDIA_CENTER = [22.5, 80];

export default function IndiaLeafletMap({ cities = [] }) {
  const markers = useMemo(() => {
    return cities
      .map((c) => {
        const coords = getCityCoordinates(c.city);
        if (!coords) return null;
        const size = Math.min(30, 14 + Math.sqrt(c.count) * 3);
        return { ...c, lat: coords[0], lng: coords[1], size };
      })
      .filter(Boolean);
  }, [cities]);

  const citiesImpacted = cities.length;
  const skippedCities = cities.length - markers.length;

  return (
    <div className="relative rounded-xl border border-border bg-panel p-2">
      <div className="pointer-events-none absolute right-5 top-5 z-[500] w-44 rounded-lg border border-border bg-panel2/90 px-3 py-2 text-[11px] leading-5 text-slate-300 backdrop-blur">
        <div><span className="text-red-400">Red</span> = Critical (&gt;100)</div>
        <div><span className="text-orange-300">Orange</span> = High (50-100)</div>
        <div><span className="text-sky-400">Blue</span> = Normal (&lt;50)</div>
      </div>

      {citiesImpacted > 0 && (
        <div className="pointer-events-none absolute bottom-5 right-5 z-[500] rounded-lg border border-border bg-panel2/90 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
          <div className="font-semibold text-slate-200">
            ALERT: {citiesImpacted} {citiesImpacted === 1 ? "City" : "Cities"} Impacted
          </div>
        </div>
      )}

      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={12}
        scrollWheelZoom={true}
        style={{ height: "420px", width: "100%", borderRadius: "10px", background: "#0a1120", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50} iconCreateFunction={makeClusterIcon}>
          {markers.map((m) => (
            <Marker
              key={m.city}
              position={[m.lat, m.lng]}
              icon={makeIcon(SEVERITY_COLOR[m.severity], m.size)}
              offlineCount={m.count}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700 }}>{m.city}</div>
                  <div>
                    Offline vehicles: <b>{m.count}</b>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
                    Clients: {m.clients.slice(0, 5).join(", ")}
                    {m.clients.length > 5 ? ` +${m.clients.length - 5} more` : ""}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {skippedCities > 0 && (
        <p className="mt-2 px-2 text-[11px] text-slate-500">
          {skippedCities} {skippedCities === 1 ? "city isn't" : "cities aren't"} in the coordinates
          list yet, so {skippedCities === 1 ? "it isn't" : "they aren't"} plotted (still counted
          everywhere else).
        </p>
      )}
    </div>
  );
}
