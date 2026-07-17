import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import TWEEN from "@tweenjs/tween.js";

import { CONFIG } from "./config.js";
import { loadData } from "./data.js";
import { tableLayout, sphereLayout, helixLayout, gridLayout } from "./layouts.js";
import { initTokenClient, requestSheetsAccess, decodeIdToken } from "./auth.js";

let camera, scene, renderer, controls;
let objects = [];
let targets = { table: [], sphere: [], helix: [], grid: [] };

init3D();
animate();
wireLoginScreen();

// ------------------------------------------------------------------
// Login handling
// ------------------------------------------------------------------

// Called by Google Identity Services after a successful sign-in
// (referenced via data-callback in index.html, so must be on window).
// This replaces the placeholder defined in index.html's <head>.
window.handleCredentialResponse = function (response) {
  const profile = decodeIdToken(response.credential);
  console.log("Signed in as:", profile?.name, profile?.email);
  enterApp();
};

// If Google's callback fired before this module finished loading (the race
// the placeholder guards against), process that response now.
if (window.__pendingCredentialResponse) {
  window.handleCredentialResponse(window.__pendingCredentialResponse);
  window.__pendingCredentialResponse = null;
}

function wireLoginScreen() {
  // Dev shortcut so you can build/test the 3D view before OAuth is fully wired up
  document.getElementById("dev-skip-btn").addEventListener("click", enterApp);

  const clientIdIsPlaceholder =
    document.getElementById("g_id_onload")?.dataset.client_id?.startsWith("YOUR_CLIENT_ID");

  if (clientIdIsPlaceholder) {
    // Hide the real Google button so it can't be clicked with a fake Client ID
    // (that's what causes the Google error page). Once you've filled in a
    // real Client ID in both config.js and index.html, this no longer applies
    // — the button shows regardless of USE_LOCAL_DATA_ONLY, so you can test
    // the sign-in flow itself even while still using local CSV data.
    document.getElementById("g_id_onload")?.remove();
    document.querySelector(".g_id_signin")?.remove();
    return;
  }

  // Prepares the token client so that once the user is signed in we can
  // request an access token scoped for Sheets access.
  function initializeTokenClient() {
    if (typeof google !== "undefined" && google.accounts && google.accounts.oauth2) {
      console.log("Initializing token client...");
      initTokenClient((token) => {
        console.log("Token received, loading data...");
        loadAndBuild(token);
      });
    } else {
      console.log("Google library not loaded yet, retrying...");
      setTimeout(initializeTokenClient, 100);
    }
  }

  // Start trying to initialize immediately, don't wait for window.load
  initializeTokenClient();
}

async function enterApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").style.display = "block";

  // The container was 0x0 while #app was display:none, which left
  // TrackballControls' internal screen-size measurements stuck at zero
  // (frozen camera, no response to drag/scroll). Force a recalculation
  // now that the element actually has real dimensions.
  onWindowResize();
  if (controls && typeof controls.handleResize === "function") {
    controls.handleResize();
  }

  if (!CONFIG.USE_LOCAL_DATA_ONLY) {
    // Real flow: request an access token, then fetch the Sheet once we have it
    // Show a message to the user and the manual button
    const indicator = document.getElementById("loading-indicator");
    const authBtn = document.getElementById("authorize-sheets");
    indicator.style.display = "block";
    indicator.textContent = "Click the button below to authorize Google Sheets access!";
    authBtn.style.display = "block";
    
    // Wire up the manual auth button
    authBtn.onclick = () => {
      try {
        requestSheetsAccess();
      } catch (err) {
        console.error("Error requesting Sheets access:", err);
        indicator.textContent = "Failed to get access, using local data...";
        authBtn.style.display = "none";
        // Fallback to local data if Sheets access fails
        setTimeout(() => loadAndBuild(null), 1000);
      }
    };
    
    // Also try to auto-request first, in case popups are allowed
    try {
      requestSheetsAccess();
    } catch (err) {
      console.log("Auto-request failed, waiting for user to click button:", err);
    }
  } else {
    // Dev flow: skip the Sheets round trip and just use the bundled CSV
    await loadAndBuild(null);
  }
}

async function loadAndBuild(accessToken) {
  const indicator = document.getElementById("loading-indicator");
  const authBtn = document.getElementById("authorize-sheets");
  indicator.style.display = "block";
  authBtn.style.display = "none"; // Hide the auth button once we're loading
  try {
    const records = await loadData(accessToken);
    buildElements(records);
    computeAllTargets(records.length);
    transform(targets.table, 2000);
    setActiveButton("table");
  } catch (err) {
    console.error(err);
    alert("Failed to load data — check console for details.");
  } finally {
    indicator.style.display = "none";
  }
}

// ------------------------------------------------------------------
// Three.js scene setup
// ------------------------------------------------------------------

function init3D() {
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener("change", render);

  window.addEventListener("resize", onWindowResize);

  document.getElementById("table").addEventListener("click", () => {
    transform(targets.table, 2000); setActiveButton("table");
  });
  document.getElementById("sphere").addEventListener("click", () => {
    transform(targets.sphere, 2000); setActiveButton("sphere");
  });
  document.getElementById("helix").addEventListener("click", () => {
    transform(targets.helix, 2000); setActiveButton("helix");
  });
  document.getElementById("grid").addEventListener("click", () => {
    transform(targets.grid, 2000); setActiveButton("grid");
  });
}

function setActiveButton(id) {
  document.querySelectorAll("#menu button").forEach((b) => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ------------------------------------------------------------------
// Building the data "tiles" as CSS3DObjects
// ------------------------------------------------------------------

function netWorthTier(value) {
  const { LOW_MAX, MID_MAX } = CONFIG.NET_WORTH_TIERS;
  if (value < LOW_MAX) return "tier-low";
  if (value <= MID_MAX) return "tier-mid";
  return "tier-high";
}

function formatCurrency(value) {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildElements(records) {
  // Clear any previous run (e.g. dev hot-reload)
  objects.forEach((obj) => scene.remove(obj));
  objects = [];

  records.forEach((record) => {
    const el = document.createElement("div");
    el.className = "element " + netWorthTier(record.netWorth);

    const country = document.createElement("div");
    country.className = "country";
    country.textContent = record.country;
    el.appendChild(country);

    const netWorth = document.createElement("div");
    netWorth.className = "netWorth";
    netWorth.textContent = formatCurrency(record.netWorth);
    el.appendChild(netWorth);

    const photo = document.createElement("img");
    photo.className = "photo";
    photo.src = record.photo;
    photo.onerror = () => { photo.style.visibility = "hidden"; };
    el.appendChild(photo);

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = record.name;
    el.appendChild(name);

    const interest = document.createElement("div");
    interest.className = "interest";
    interest.textContent = record.interest + " · " + record.age;
    el.appendChild(interest);

    const object = new CSS3DObject(el);
    // Scatter initial spawn position randomly so the first transform-in looks intentional
    object.position.x = Math.random() * 4000 - 2000;
    object.position.y = Math.random() * 4000 - 2000;
    object.position.z = Math.random() * 4000 - 2000;

    scene.add(object);
    objects.push(object);
  });
}

function computeAllTargets(count) {
  targets.table = tableLayout(count, 20, 10);
  targets.sphere = sphereLayout(count);
  targets.helix = helixLayout(count);
  targets.grid = gridLayout(count, 5, 4, 10);
}

// ------------------------------------------------------------------
// Layout transition animation (TWEEN)
// ------------------------------------------------------------------

function transform(target, duration) {
  TWEEN.removeAll();

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const targetObj = target[i];
    if (!targetObj) continue;

    new TWEEN.Tween(object.position)
      .to({ x: targetObj.position.x, y: targetObj.position.y, z: targetObj.position.z }, duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    const startRotation = {
      x: object.rotation.x,
      y: object.rotation.y,
      z: object.rotation.z,
    };
    const endRotation = {
      x: targetObj.rotation.x,
      y: targetObj.rotation.y,
      z: targetObj.rotation.z,
    };

    new TWEEN.Tween(startRotation)
      .to(endRotation, duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .onUpdate(() => {
        object.rotation.x = startRotation.x;
        object.rotation.y = startRotation.y;
        object.rotation.z = startRotation.z;
      })
      .start();
  }

  new TWEEN.Tween({})
    .to({}, duration * 1.5)
    .onUpdate(render)
    .start();
}

// ------------------------------------------------------------------
// Render loop
// ------------------------------------------------------------------

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);
  try {
    TWEEN.update();
    controls.update();
    render(); // always re-render — don't rely solely on controls' 'change' event
  } catch (err) {
    console.error("Render loop error:", err);
  }
}

function render() {
  renderer.render(scene, camera);
}
