// Address lookup using OpenStreetMap Nominatim (free, no API key).
// Nominatim asks for no more than one request per second, so requests are spaced out.
// Results are cached in localStorage so repeat addresses are never looked up twice.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const CACHE_KEY = 'campmap.geocache.v1';
const MIN_GAP_MS = 1100;

let lastRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

// Returns { lat, lng } or null if the address was not found.
// Throws if the lookup service itself fails.
export async function geocodeAddress(address) {
  const key = address.trim().toLowerCase();
  const cache = readCache();
  if (cache[key]) return cache[key];

  const wait = lastRequestAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`lookup service returned HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const point = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  const fresh = readCache();
  fresh[key] = point;
  localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
  return point;
}
