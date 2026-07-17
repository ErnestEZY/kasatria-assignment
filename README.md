# Kasatria Assignment: 3D Interactive Data Visualization


An interactive 3D periodic table-style visualization built with Three.js, populated with custom data from Google Sheets.

## Features
- 🎨 **Multiple Layouts**: Switch between Table, Sphere, Helix, and Grid views
- 📊 **Net Worth Coloring**: Red (< $100K), Orange ($100K-$200K), Green (> $200K)
- 🔐 **Google OAuth**: Sign in with Google to access live Google Sheet data
- 📱 **Interactive Controls**: Drag to rotate, scroll to zoom

## How to Use (For Evaluators)
1. Visit the live site: [https://ernestezy.github.io/kasatria-assignment/](https://ernestezy.github.io/kasatria-assignment/)
2. Click the **Sign in with Google** button
3. Grant permission to access Google Sheets (when prompted)
4. Explore the 3D visualization!
5. Use the buttons at the top to switch between layouts

## Technologies Used
- Three.js (with CSS3DRenderer)
- TWEEN.js (for smooth animations)
- Google Identity Services (OAuth 2.0)
- Google Sheets API
- Vanilla JavaScript, HTML, CSS

## Local Development
1. Clone the repository
2. Start a local server (e.g., `python -m http.server 8080`)
3. Open `http://localhost:8080` in your browser
4. (Optional) Click "Skip login" to use the local CSV data

## Project Structure
```
├── index.html           # Main HTML file with login and app
├── css/
│   └── style.css        # All styling
├── data/
│   └── Data_Template.csv # Local test data
└── js/
    ├── config.js        # Configuration (Google Client ID, Sheet ID)
    ├── app.js           # Main app logic
    ├── auth.js          # Google OAuth handling
    ├── data.js          # Data loading (local CSV or Google Sheets)
    └── layouts.js       # Layout calculations
```
