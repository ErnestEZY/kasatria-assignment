import { CONFIG } from "./config.js";

/**
 * Minimal CSV parser that handles quoted fields containing commas,
 * e.g. "$251,260.80" — enough for this dataset without pulling in a library.
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n" || char === "\r") {
        if (field !== "" || row.length) { row.push(field); rows.push(row); }
        field = ""; row = [];
        if (char === "\r" && next === "\n") i++;
      } else {
        field += char;
      }
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(c => c.trim() !== ""));
}

function toRecord([name, photo, age, country, interest, netWorthRaw]) {
  const netWorth = parseFloat(String(netWorthRaw).replace(/[$,]/g, "")) || 0;
  return {
    name: (name || "").trim(),
    photo: (photo || "").trim(),
    age: parseInt(age, 10) || 0,
    country: (country || "").trim(),
    interest: (interest || "").trim(),
    netWorth,
  };
}

/** Load and parse the bundled local CSV (used for dev/testing without OAuth). */
export async function loadLocalData() {
  const res = await fetch(CONFIG.LOCAL_CSV_PATH);
  const text = await res.text();
  const rows = parseCSV(text);
  rows.shift(); // drop header row
  return rows.map(toRecord);
}

/**
 * Fetch data from the Google Sheet using an OAuth access token
 * obtained via the Google Identity Services token client (see auth.js).
 */
export async function loadSheetData(accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(CONFIG.SHEET_RANGE)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Sheets API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const rows = json.values || [];
  return rows.map(toRecord);
}

/** Single entry point: picks local CSV or live Sheets data based on config/token. */
export async function loadData(accessToken) {
  if (CONFIG.USE_LOCAL_DATA_ONLY || !accessToken) {
    return loadLocalData();
  }
  return loadSheetData(accessToken);
}
