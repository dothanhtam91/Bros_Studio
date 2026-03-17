/**
 * Travel fee calculation from address.
 * Uses distance service: geocode → road route (OSRM) → Haversine fallback → travel fee if > 20 miles.
 */

import { getDistanceResult } from "./distance";
import { computeTravelFee } from "./pricing";

export interface TravelResult {
  distanceMiles: number | null;
  travelFee: number;
  geocoded: boolean;
}

/** Get distance and travel fee for an address. Uses road distance when available. */
export async function getTravelForAddress(
  address: string
): Promise<TravelResult> {
  const result = await getDistanceResult(address);

  if (result.distanceSource === "unavailable" || result.distanceMiles == null) {
    return {
      distanceMiles: null,
      travelFee: 0,
      geocoded: false,
    };
  }

  const fee = computeTravelFee(result.distanceMiles);

  return {
    distanceMiles: result.distanceMiles,
    travelFee: fee,
    geocoded: true,
  };
}
