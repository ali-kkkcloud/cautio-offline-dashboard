"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, GeoJSON, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCityCoordinates } from "../lib/cityCoordinates";
import indiaGeo from "../lib/indiaGeo.json";

const SEVERITY_COLOR = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#22d3ee",
};

const INDIA_STYLE = {
  color: "#22d3ee",
  weight: 1.4,
  opacity: 0.9,
  fillColor: "#0a1e24",
  fillOpacity: 1,
  dashArray: "1,4",
};

function makeDotIcon(color, size) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      box-shadow:0 0 6px 2px ${color}99, 0 0 0 3px ${color}22;
      border:1px solid rgba(5,7,10,0.6);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitToIndia() {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(indiaGeo);
    const bounds = layer.getBounds();
    map.fitBounds(bounds, { padding: [8, 8] });
    map.setMinZoom(map.getZoom());
    map.setMaxBounds(bounds.pad(0.25));
  }, [map]);
  return null;
}

export default function IndiaLeafletMap({ cities = [] }) {
  const markers = useMemo(() => {
    return cities
      .map((c) => {
        const coords = getCityCoordinates(c.city);
        if (!coords) return null;
        const size = Math.min(20, 8 + Math.sqrt(c.count) * 2);
        return { ...c, lat: coords[0], lng: coords[1], size };
      })
      .filter(Boolean);
  }, [cities]);

  const citiesImpacted = cities.length;
  const skippedCities = cities.length - markers.length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-[#05070a] p-2">
      <div className="pointer-events-none absolute bottom-5 left-5 z-[500] rounded-lg border border-border bg-panel2/90 px-3 py-2 text-[11px] leading-6 text-slate-300 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR.critical }} />
          Critical (&gt;100)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR.high }} />
          High (50-100)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR.medium }} />
          Medium (20-49)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR.low }} />
          Low (&lt;20)
        </div>
      </div>

      {citiesImpacted > 0 && (
        <div className="pointer-events-none absolute right-5 top-5 z-[500] rounded-lg border border-border bg-panel2/90 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
          <span className="font-semibold text-slate-200">
            ALERT: {citiesImpacted} {citiesImpacted === 1 ? "City" : "Cities"} Impacted
          </span>
        </div>
      )}

      <MapContainer
        center={[22, 80]}
        zoom={4}
        zoomControl={false}
        scrollWheelZoom={false}
        style={{ height: "540px", width: "100%", background: "#05070a" }}
      >
        <ZoomControl position="topright" />
        <FitToIndia />
        <GeoJSON data={indiaGeo} style={INDIA_STYLE} />
        {markers.map((m) => (
          <Marker key={m.city} position={[m.lat, m.lng]} icon={makeDotIcon(SEVERITY_COLOR[m.severity], m.size)}>
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
