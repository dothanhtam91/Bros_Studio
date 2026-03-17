import { NextResponse } from "next/server";

const NOMINATIM_TIMEOUT_MS = 6000;

// US state name → 2-letter abbreviation (common ones)
const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL",
  Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN",
  Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME",
  Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE",
  Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX",
  Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  street?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  state?: string;
  postcode?: string;
  [key: string]: string | undefined;
};

/**
 * Build a short Google-style address: street, city, state zip (no comma).
 * Uses only the main components; no county, country, or long display_name.
 */
function formatShortAddress(addr: NominatimAddress): string {
  const number = (addr.house_number || "").trim();
  const road = (addr.road || addr.street || "").trim();
  const street = [number, road].filter(Boolean).join(" ").trim() || "Address";
  const city = (addr.city || addr.town || addr.village || addr.suburb || "").trim();
  const stateRaw = (addr.state || "").trim();
  const state = stateRaw.length === 2 ? stateRaw : (STATE_ABBR[stateRaw] || stateRaw);
  const postcode = (addr.postcode || "").trim();

  const parts = [street];
  if (city) parts.push(city);
  if (state || postcode) parts.push([state, postcode].filter(Boolean).join(" ").trim());

  return parts.filter(Boolean).join(" ");
}

/**
 * Address autocomplete using Nominatim (OSM).
 * Returns short, Google-style suggestions (street city state zip, no comma).
 * Nominatim allows 1 request per second; client should debounce (e.g. 500ms+).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const encoded = encodeURIComponent(q);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1&countrycodes=us`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": "BrosStudio/1.0 (photography booking)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data = (await res.json()) as Array<{ address?: NominatimAddress }>;
    const suggestions = (data || [])
      .filter((item) => item?.address && typeof item.address === "object")
      .map((item) => formatShortAddress(item.address as NominatimAddress))
      .filter(Boolean);

    // Dedupe and keep order
    const seen = new Set<string>();
    const unique = suggestions.filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });

    return NextResponse.json({
      suggestions: unique.map((address) => ({ address })),
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
