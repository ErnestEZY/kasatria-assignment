// ============================================================
// Fill these in once you have your Google Cloud OAuth Client ID
// and your Google Sheet set up. See README.md for setup steps.
// ============================================================

export const CONFIG = {
  // From Google Cloud Console > APIs & Services > Credentials
  GOOGLE_CLIENT_ID: "268210721095-f80t5cmmj41q1uu0nfejbp7qck4lmer4.apps.googleusercontent.com",

  // The long ID in your Sheet's URL: docs.google.com/spreadsheets/d/<THIS>/edit
  SHEET_ID: "1v9opDmumL2THSBLBZ7dVLiJ2DTXoX3OODEZCmqwFxlA",

  // Adjust to match however many rows your sheet has (header row excluded)
  SHEET_RANGE: "Data_Template!A2:F201",

  // Scope needed to read Sheets data
  SHEETS_SCOPE: "https://www.googleapis.com/auth/spreadsheets.readonly",

  // Set to true to always use the local CSV instead of calling the Sheets API
  // (handy while YOUR_CLIENT_ID / YOUR_SHEET_ID are still placeholders)
  USE_LOCAL_DATA_ONLY: false,

  LOCAL_CSV_PATH: "data/Data_Template.csv",

  // Net worth color tier thresholds (per assignment spec)
  NET_WORTH_TIERS: {
    LOW_MAX: 100000,   // < 100K -> red
    MID_MAX: 200000,   // 100K-200K -> orange, > 200K -> green
  },
};
