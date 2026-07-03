// lib/sheet.js
// Reads data straight from a Google Sheet using the public "gviz" JSON
// endpoint (no API key / service account needed) as long as the sheet is
// shared as "Anyone with the link -> Viewer".
//
// Rules implemented (as requested):
//  1. "Client"            -> client name
//  2. "Vehicle Number"    -> one row = one vehicle
//  3. Offline duration    -> only keep rows OLDER than OFFLINE_HOURS
//                            (default 48h). Uses "Offline Since (hrs)" if
//                            present, otherwise parses "Last Online" as a date.
//  4. "R/N"               -> if this column says "Not running" or
//                            "Device Removed" (case-insensitive), the row is
//                            EXCLUDED entirely, no matter what.
//  5. "Installation city" -> used to plot cities on the map.

const SHEET_ID = process.env.SHEET_ID || "180CqEujgBjJPjP9eU8C--xMj-VTBSrRUrM_98-S0gjo";
const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";
const OFFLINE_HOURS = Number(process.env.OFFLINE_HOURS || 48);

const EXCLUDED_RN_VALUES = ["not running", "device removed"];

function buildGvizUrl() {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
  const params = new URLSearchParams({
    tqx: "out:json",
    sheet: SHEET_TAB,
  });
  return `${base}?${params.toString()}`;
}

// Google wraps the JSON in `google.visualization.Query.setResponse(...)`.
function stripGvizWrapper(text) {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start === -1 || end === -1) {
    throw new Error("Unexpected response from Google Sheets (not shared publicly?)");
  }
  return text.substring(start + 1, end);
}

// gviz date cells look like: "Date(2024,0,15,10,30,0)" (month is 0-indexed)
function parseGvizDate(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" && raw.startsWith("Date(")) {
    const nums = raw
      .substring(5, raw.length - 1)
      .split(",")
      .map((n) => Number(n.trim()));
    const [y, mo, d, h = 0, mi = 0, s = 0] = nums;
    if (Number.isNaN(y)) return null;
    return new Date(y, mo, d, h, mi, s);
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeHeader(label) {
  return String(label || "").trim().toLowerCase();
}

function findColumnIndex(cols, matchers) {
  for (let i = 0; i < cols.length; i++) {
    const label = normalizeHeader(cols[i].label);
    for (const m of matchers) {
      if (label === m || label.includes(m)) return i;
    }
  }
  return -1;
}

function cellValue(row, idx) {
  if (idx === -1) return null;
  const cell = row.c[idx];
  if (!cell) return null;
  return cell.v !== undefined ? cell.v : null;
}

function cellText(row, idx) {
  if (idx === -1) return "";
  const cell = row.c[idx];
  if (!cell) return "";
  if (cell.f !== undefined && cell.f !== null) return String(cell.f).trim();
  if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
  return "";
}

export async function fetchRawSheet() {
  const url = buildGvizUrl();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Could not read the Google Sheet (HTTP ${res.status}). Make sure it is shared as "Anyone with the link – Viewer".`
    );
  }
  const text = await res.text();
  const json = JSON.parse(stripGvizWrapper(text));
  if (json.status === "error") {
    const msg = (json.errors || []).map((e) => e.detailed_message).join("; ");
    throw new Error(`Google Sheets error: ${msg || "unknown"}`);
  }
  return json.table;
}

export function computeDashboard(table) {
  const cols = table.cols || [];
  const rows = table.rows || [];

  const idxClient = findColumnIndex(cols, ["client"]);
  const idxVehicle = findColumnIndex(cols, ["vehicle number", "vehicle no", "vehicle"]);
  const idxLastOnline = findColumnIndex(cols, ["last online"]);
  const idxOfflineHrs = findColumnIndex(cols, [
    "offline since (hrs)",
    "offline since",
    "offline hours",
    "offline hrs",
  ]);
  const idxRN = findColumnIndex(cols, ["r/n", "r / n", "rn"]);
  const idxCity = findColumnIndex(cols, ["installation city", "installation  city", "city"]);

  if (idxClient === -1 || idxLastOnline === -1) {
    throw new Error(
      "Could not find 'Client' and/or 'Last Online' columns in the sheet. Check the header names in Sheet1."
    );
  }

  const offlineRows = [];

  for (const row of rows) {
    if (!row || !row.c) continue;

    const rnText = normalizeHeader(cellText(row, idxRN));
    if (EXCLUDED_RN_VALUES.includes(rnText)) continue; // rule #4

    let hoursOffline = null;

    if (idxOfflineHrs !== -1) {
      const raw = cellValue(row, idxOfflineHrs);
      const num = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, ""));
      if (!Number.isNaN(num)) hoursOffline = num;
    }

    if (hoursOffline === null) {
      const lastOnlineRaw = cellValue(row, idxLastOnline);
      const lastOnlineDate = parseGvizDate(lastOnlineRaw);
      if (lastOnlineDate) {
        hoursOffline = (Date.now() - lastOnlineDate.getTime()) / (60 * 60 * 1000);
      }
    }

    if (hoursOffline === null || Number.isNaN(hoursOffline)) continue;
    if (hoursOffline <= OFFLINE_HOURS) continue;

    const client = cellText(row, idxClient) || "Unknown";
    const vehicle = cellText(row, idxVehicle);
    const city = cellText(row, idxCity) || "Unknown";

    offlineRows.push({
      client,
      vehicle,
      city,
      hoursOffline: Math.round(hoursOffline * 100) / 100,
    });
  }

  // ----- Aggregate per client -----
  const clientMap = new Map();
  for (const r of offlineRows) {
    if (!clientMap.has(r.client)) {
      clientMap.set(r.client, { client: r.client, count: 0, cities: new Set() });
    }
    const entry = clientMap.get(r.client);
    entry.count += 1;
    if (r.city) entry.cities.add(r.city);
  }

  const severityOf = (count) => {
    if (count > 100) return "critical";
    if (count >= 50) return "high";
    if (count >= 20) return "medium";
    return "low";
  };

  const clients = Array.from(clientMap.values())
    .map((c) => ({
      name: c.client,
      count: c.count,
      cities: Array.from(c.cities),
      severity: severityOf(c.count),
    }))
    .sort((a, b) => b.count - a.count);

  // ----- Aggregate per city (for the map) -----
  const cityMap = new Map();
  for (const r of offlineRows) {
    if (!r.city) continue;
    if (!cityMap.has(r.city)) {
      cityMap.set(r.city, { city: r.city, count: 0, clients: new Set() });
    }
    const entry = cityMap.get(r.city);
    entry.count += 1;
    entry.clients.add(r.client);
  }

  const cities = Array.from(cityMap.values())
    .map((c) => ({
      city: c.city,
      count: c.count,
      clients: Array.from(c.clients),
      severity: severityOf(c.count),
    }))
    .sort((a, b) => b.count - a.count);

  const totalOfflineVehicles = offlineRows.length;
  const totalClients = clients.length;
  const criticalClients = clients.filter((c) => c.severity === "critical").length;
  const citiesAffected = cities.length;

  return {
    generatedAt: new Date().toISOString(),
    offlineHoursThreshold: OFFLINE_HOURS,
    stats: {
      totalOfflineVehicles,
      totalClients,
      criticalClients,
      citiesAffected,
    },
    clients,
    cities,
  };
}

export async function getDashboardData() {
  const table = await fetchRawSheet();
  return computeDashboard(table);
}
