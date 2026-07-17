# Kasatria Assignment — 3D Data Explorer

Three.js CSS3D periodic-table demo adapted to render people-data tiles
(name, photo, country, interest, net worth) in 4 layouts: **Table (20×10)**,
**Sphere**, **double Helix**, and **Grid (5×4×10)**.

## Right now (works out of the box)

`config.js` has `USE_LOCAL_DATA_ONLY: true`, so the app currently skips
Google login entirely and loads `data/Data_Template.csv` directly.

To try it:
```
cd kasatria-periodic-table
python3 -m http.server 8080
```
Open `http://localhost:8080`, click **"Skip login (use local test data)"**,
and you should see the 200 tiles in the table layout. Click TABLE / SPHERE /
HELIX / GRID to switch layouts. Drag to rotate, scroll to zoom (TrackballControls).

## Wiring up real Google Sign-In + Sheets

1. **Google Cloud Console**
   - Create a project, enable the **Google Sheets API**
   - Configure the OAuth consent screen (External, add yourself as a test user,
     add scope `.../auth/spreadsheets.readonly`)
   - Create an **OAuth Client ID** (Web application)
   - Add `http://localhost:8080` (or whatever port you use) as an
     **Authorized JavaScript origin**

2. **Google Sheet**
   - Create a new Sheet, import `Data_Template.csv`
   - Share it with `lisa@kasatria.com` (per assignment instructions) and
     with your own test account
   - Copy the Sheet ID from its URL

3. **Edit `js/config.js`**
   ```js
   GOOGLE_CLIENT_ID: "your-actual-client-id.apps.googleusercontent.com",
   SHEET_ID: "your-actual-sheet-id",
   SHEET_RANGE: "Sheet1!A2:F201",   // adjust row count to your sheet
   USE_LOCAL_DATA_ONLY: false,
   ```

4. **Edit `index.html`**
   - Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` in the
     `#g_id_onload` div with your real client ID (same value as in config.js)

5. Reload, sign in with Google, grant Sheets access when prompted — the app
   will fetch live data from your Sheet instead of the local CSV.

6. Once it works locally, deploy (GitHub Pages / Vercel / Netlify), then go
   back to Cloud Console and add your production URL as an additional
   Authorized JavaScript origin (you can keep localhost listed too).

## File structure

```
index.html          Login screen + app shell, import map for Three.js/TWEEN
css/style.css        All styling (login card, tiles, menu, legend)
js/config.js         Your Client ID / Sheet ID / tier thresholds go here
js/data.js           CSV parser (local) + Google Sheets API fetcher
js/layouts.js        Table / Sphere / double-Helix / Grid position math
js/auth.js           Google Identity Services token client wrapper
js/app.js            Scene setup, tile building, layout transitions, render loop
data/Data_Template.csv   Local copy of your sample data for dev/testing
```

## Notes / things to double check before submitting

- Net worth color tiers are set in `config.js` (`NET_WORTH_TIERS`) matching
  the spec: **< $100K → red, $100K–$200K → orange, > $200K → green**.
- Photos are loaded via `<img>` `src`; if a photo URL 404s, it just hides
  the broken image icon rather than breaking the tile (`onerror` handler
  in `app.js`).
- Table = 20×10, Grid = 5×4×10 — both exactly hold 200 tiles, matching the
  row count in `Data_Template.csv`. If your real Sheet has a different row
  count, you'll need to adjust `SHEET_RANGE` and the layout dimensions
  passed into `tableLayout()` / `gridLayout()` in `app.js`.
- The double helix in `layouts.js` interleaves two strands offset by 180°
  (`strandGap = Math.PI`) rather than the single-strand default from the
  original three.js demo.
