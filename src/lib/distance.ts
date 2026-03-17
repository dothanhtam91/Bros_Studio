/**
 * Distance calculation: fixed origin (Katy, TX 77449) → geocode address → road distance (OSRM) with Haversine fallback.
 * Single server-side utility. Geocoder and router are swappable.
 */

import { haversineMiles } from "./pricing";

// Fixed origin: Katy, TX 77449 (exact coordinates)
export const ORIGIN = { lat: 29.8177, lng: -95.749 } as const;

const GEOCODE_TIMEOUT_MS = 8000;
const ROUTE_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const METERS_TO_MILES = 1 / 1609.344;

export type DistanceSource = "road-route" | "haversine-fallback" | "unavailable";

export interface DistanceResult {
  inputAddress: string;
  normalizedAddress: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  distanceMiles: number | null;
  distanceSource: DistanceSource;
  error: string | null;
}

// In-memory caches (address → coords, route key → miles). TTL 24h.
const geocodeCache = new Map<string, { lat: number; lng: number; normalized: string }>();
const distanceCache = new Map<string, { miles: number; source: DistanceSource }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

function cacheGet<T>(cache: Map<string, T>, key: string): T | undefined {
  const t = cacheTimestamps.get(key);
  if (t != null && Date.now() - t > CACHE_TTL_MS) {
    cache.delete(key);
    cacheTimestamps.delete(key);
    return undefined;
  }
  return cache.get(key);
}

function cacheSet(key: string, value: unknown, cache: Map<string, unknown>): void {
  cache.set(key, value);
  cacheTimestamps.set(key, Date.now());
}

/** Normalize address: trim, collapse spaces, standardize abbreviations. */
export function normalizeAddress(address: string): string {
  let s = address
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");
  const abbr: [RegExp, string][] = [
    [/\bStreet\b/gi, "St"],
    [/\bAvenue\b/gi, "Ave"],
    [/\bBoulevard\b/gi, "Blvd"],
    [/\bDrive\b/gi, "Dr"],
    [/\bLane\b/gi, "Ln"],
    [/\bCourt\b/gi, "Ct"],
    [/\bCircle\b/gi, "Cir"],
    [/\bRoad\b/gi, "Rd"],
    [/\bHighway\b/gi, "Hwy"],
    [/\bSuite\b/gi, "Ste"],
    [/\bTexas\b/gi, "TX"],
  ];
  for (const [re, replacement] of abbr) {
    s = s.replace(re, replacement);
  }
  return s.trim();
}

/** Reject incomplete or unclear addresses (too short or no ZIP). Accepts "street city state zip" (no comma) or "street, city, state zip". */
function isAddressAcceptable(normalized: string): boolean {
  if (normalized.length < 15) return false;
  const hasZip = /\d{5}(-\d{4})?/.test(normalized);
  return hasZip;
}

/** Geocode using Nominatim (OSM). Timeout + retries. Returns null on failure. */
async function geocodeDestination(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const cached = cacheGet(geocodeCache, address);
  if (cached) return { lat: cached.lat, lng: cached.lng };

  const q = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
      const res = await fetch(url, {
        headers: { "User-Agent": "BrosStudio/1.0 (photography booking)" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      const first = data?.[0];
      if (!first?.lat || !first?.lon) return null;
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      cacheSet(address, { lat, lng, normalized: address }, geocodeCache as Map<string, unknown>);
      return { lat, lng };
    } catch {
      if (attempt === MAX_RETRIES) return null;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return null;
}

/** Get driving distance in meters from OSRM. Returns null on failure. No cache (caller caches). */
async function getRoadDistanceMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<number | null> {
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const data = (await res.json()) as { code: string; routes?: Array<{ distance: number }> };
      if (data?.code !== "Ok" || !data.routes?.[0]) continue;
      const meters = data.routes[0].distance;
      if (!Number.isFinite(meters) || meters <= 0) continue;
      return meters;
    } catch {
      if (attempt === MAX_RETRIES) return null;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

/** Round displayed miles to 1 decimal place. */
function roundMiles(miles: number): number {
  return Math.round(miles * 10) / 10;
}

/**
 * Compute distance from fixed origin (Katy, TX 77449) to the given address.
 * Uses road routing (OSRM) first; falls back to Haversine only if routing fails.
 * Returns a structured result; does not use ZIP-only or return 0 on failure.
 */
export async function getDistanceResult(
  inputAddress: string
): Promise<DistanceResult> {
  const empty: DistanceResult = {
    inputAddress,
    normalizedAddress: null,
    destinationLat: null,
    destinationLng: null,
    distanceMiles: null,
    distanceSource: "unavailable",
    error: null,
  };

  const trimmed = inputAddress.trim();
  if (!trimmed || trimmed.length < 10) {
    return { ...empty, error: "Address is too short or missing." };
  }

  const normalizedAddress = normalizeAddress(trimmed);
  if (!isAddressAcceptable(normalizedAddress)) {
    return {
      ...empty,
      normalizedAddress,
      error: "Address appears incomplete. Please include street, city, state, and ZIP.",
    };
  }

  const coords = await geocodeDestination(normalizedAddress);
  if (!coords) {
    return {
      ...empty,
      normalizedAddress,
      error: "Could not verify address. Please check and try again.",
    };
  }

  const routeKey = `${ORIGIN.lat},${ORIGIN.lng};${coords.lat},${coords.lng}`;
  const cachedDist = cacheGet(distanceCache, routeKey);
  if (cachedDist) {
    return {
      inputAddress,
      normalizedAddress,
      destinationLat: coords.lat,
      destinationLng: coords.lng,
      distanceMiles: cachedDist.miles,
      distanceSource: cachedDist.source,
      error: null,
    };
  }

  const meters = await getRoadDistanceMeters(
    ORIGIN.lat,
    ORIGIN.lng,
    coords.lat,
    coords.lng
  );

  if (meters != null && Number.isFinite(meters)) {
    const miles = roundMiles(meters * METERS_TO_MILES);
    cacheSet(routeKey, { miles, source: "road-route" }, distanceCache as Map<string, unknown>);
    return {
      inputAddress,
      normalizedAddress,
      destinationLat: coords.lat,
      destinationLng: coords.lng,
      distanceMiles: miles,
      distanceSource: "road-route",
      error: null,
    };
  }

  const haversineMilesValue = haversineMiles(
    ORIGIN.lat,
    ORIGIN.lng,
    coords.lat,
    coords.lng
  );
  const fallbackMiles = roundMiles(haversineMilesValue);
  cacheSet(routeKey, { miles: fallbackMiles, source: "haversine-fallback" }, distanceCache as Map<string, unknown>);

  return {
    inputAddress,
    normalizedAddress,
    destinationLat: coords.lat,
    destinationLng: coords.lng,
    distanceMiles: fallbackMiles,
    distanceSource: "haversine-fallback",
    error: null,
  };
}
