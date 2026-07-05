// lib/trend.js
// Reads historical daily snapshots from a SECOND Google Sheet ("History"
// tab), which is populated every night at 11 PM by a Google Apps Script
// trigger bound to that sheet — see apps-script/nightly-snapshot.gs.
//
// This file only *reads* — it never writes. Writing happens inside Google's
// own infrastructure via the nightly trigger, independent of Vercel.

const HISTORY_SHEET_ID =
  process.env.HISTORY_SHEET_ID || "1PchIeGKCyPMNns9mwMLu6uau5td-F2f6Z2_7thQ9ynE";
const HISTORY_SHEET_TAB = process.env.HISTORY_SHEET_TAB || "History";

function buildGvizUrl() {
  const base = `https://docs.google.com/spreadsheets/d/${HISTORY_SHEET_ID}/gviz/tq`;
  const params = new URLSearchParams({ tqx: "out:json", sheet: HISTORY_SHEET_TAB });
  return `${base}?${params.toString()}`;
}

function stripGvizWrapper(text) {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start === -1 || end === -1) {
    throw new Error("Unexpected response from the History sheet (not shared publicly?)");
  }
  return text.substring(start + 1, end);
}

// gviz date cells look like "Date(2026,6,5,0,0,0)" (month is 0-indexed)
function parseGvizDate(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" && raw.startsWith("Date(")) {
    const nums = raw
      .substring(5, raw.length - 1)
      .split(",")
      .map((n) => Number(n.trim()));
    const [y, mo, d] = nums;
    if (Number.isNaN(y)) return null;
    return new Date(y, mo, d);
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shortLabel(d) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); // "05 Jul"
}

// Expects the History sheet columns in this order (as written by the Apps
// Script): Date | Total Offline Vehicles | Total Clients | Critical Clients
// | Cities Affected. Only the first two columns are required here.
export async function getTrend(days = 7) {
  let res;
  try {
    res = await fetch(buildGvizUrl(), { cache: "no-store" });
  } catch (e) {
    return { configured: false, points: [], error: e.message };
  }

  if (!res.ok) {
    return {
      configured: false,
      points: [],
      error: `Could not read the History sheet (HTTP ${res.status}). Make sure it's shared as "Anyone with the link – Viewer".`,
    };
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(stripGvizWrapper(text));
  } catch (e) {
    return { configured: false, points: [], error: e.message };
  }

  if (json.status === "error") {
    const msg = (json.errors || []).map((e) => e.detailed_message).join("; ");
    return { configured: false, points: [], error: msg || "History sheet error" };
  }

  const rows = json.table.rows || [];

  const points = rows
    .map((row) => {
      if (!row || !row.c) return null;
      const dateCell = row.c[0];
      const countCell = row.c[1];
      if (!dateCell || !countCell) return null;

      const date = parseGvizDate(dateCell.v);
      const rawCount = countCell.v;
      const count = typeof rawCount === "number" ? rawCount : parseFloat(rawCount);

      if (!date || Number.isNaN(count)) return null;
      return { date, count };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date)
    .slice(-days)
    .map((p) => ({ label: shortLabel(p.date), count: p.count }));

  return { configured: true, points };
}
