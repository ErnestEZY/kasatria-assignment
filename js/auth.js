import { CONFIG } from "./config.js";

let accessToken = null;
let tokenClient = null;
const TOKEN_KEY = "kasatria_sheets_access_token";
const TOKEN_EXPIRY_KEY = "kasatria_sheets_token_expiry";

/** Call once `google` (GIS) library is available on window. */
export function initTokenClient(onToken) {
  console.log("initTokenClient called");
  
  // Check if we have a cached token that's not expired
  const cachedToken = localStorage.getItem(TOKEN_KEY);
  const cachedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (cachedToken && cachedExpiry && Date.now() < parseInt(cachedExpiry)) {
    console.log("Using cached access token");
    accessToken = cachedToken;
    onToken(accessToken);
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    scope: CONFIG.SHEETS_SCOPE,
    callback: (tokenResponse) => {
      console.log("Token response received:", tokenResponse);
      accessToken = tokenResponse.access_token;
      // Cache the token and set expiry (expires_in is in seconds)
      const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      onToken(accessToken);
    },
    error_callback: (error) => {
      console.error("Token client error:", error);
    }
  });
  console.log("Token client initialized:", tokenClient);
}

export function requestSheetsAccess() {
  console.log("requestSheetsAccess called, tokenClient:", !!tokenClient);
  
  // Check again for cached token before requesting
  const cachedToken = localStorage.getItem(TOKEN_KEY);
  const cachedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (cachedToken && cachedExpiry && Date.now() < parseInt(cachedExpiry)) {
    console.log("Using cached access token instead of requesting new one");
    return; // Token is already valid, no need to request
  }

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
