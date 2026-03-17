/**
 * Geocoding: address → coordinates.
 * Uses OpenStreetMap Nominatim (free, no API key) by default.
 * For production you may want to use Google Maps Geocoding or similar.
 */

export interface GeoResult {
  lat: number;
  lng: number;
}

/** Geocode address to lat/lng using Nominatim (OSM). Returns null on failure. */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const q = encodeURIComponent(address.trim());
  if (!q) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "BrosStudio/1.0 (photography booking)",
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = data?.[0];
  if (!first?.lat || !first?.lon) return null;

  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
  };
}
