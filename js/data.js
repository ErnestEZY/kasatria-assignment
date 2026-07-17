import { CONFIG } from "./config.js";

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

/**
 * Fetch data from the Google Sheet using an OAuth access token
 * obtained via the Google Identity Services token client (see auth.js).
 */
export async function loadSheetData(accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(CONFIG.SHEET_RANGE)}`;
  console.log("Loading sheet from URL:", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    let errorText = "";
    try {
      const errorJson = await res.json();
      errorText = JSON.stringify(errorJson, null, 2);
    } catch (e) {
      errorText = await res.text();
    }
    console.error("Full Sheets API error response:", errorText);
    throw new Error(`Sheets API error: ${res.status} ${res.statusText} - ${errorText}`);
  }
  const json = await res.json();
  console.log("Sheets API response:", json);
  const rows = json.values || [];
  return rows.map(toRecord);
}

/** Single entry point: load live Sheets data. */
export async function loadData(accessToken) {
  return loadSheetData(accessToken);
}
