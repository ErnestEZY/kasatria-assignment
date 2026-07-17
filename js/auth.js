import { CONFIG } from "./config.js";

let accessToken = null;
let tokenClient = null;

/** Call once `google` (GIS library) is available on window. */
export function initTokenClient(onToken) {
  console.log("initTokenClient called");
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    scope: CONFIG.SHEETS_SCOPE,
    callback: (tokenResponse) => {
      console.log("Token response received:", tokenResponse);
      accessToken = tokenResponse.access_token;
      onToken(accessToken);
    },
  });
  console.log("Token client initialized:", tokenClient);
}

export function requestSheetsAccess() {
  console.log("requestSheetsAccess called, tokenClient:", !!tokenClient);
  if (!tokenClient) {
    console.warn("Token client not initialized yet.");
    return;
  }
  tokenClient.requestAccessToken();
}

export function getAccessToken() {
  return accessToken;
}

/** Decodes the identity JWT Google returns after sign-in (name/email/photo). */
export function decodeIdToken(credential) {
  try {
    const payload = JSON.parse(atob(credential.split(".")[1]));
    return payload;
  } catch (e) {
    console.error("Failed to decode ID token", e);
    return null;
  }
}
