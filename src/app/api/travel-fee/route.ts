import { NextResponse } from "next/server";
import { getDistanceResult } from "@/lib/distance";
import { computeTravelFee } from "@/lib/pricing";

export async function POST(request: Request) {
  const body = await request.json();
  const address = typeof body.address === "string" ? body.address.trim() : "";

  if (!address || address.length < 10) {
    return NextResponse.json({
      travelFee: 0,
      distanceMiles: null,
      geocoded: false,
      inputAddress: address || "",
      normalizedAddress: null,
      destinationLat: null,
      destinationLng: null,
      distanceSource: "unavailable",
      error: "Address is too short or missing.",
    });
  }

  const result = await getDistanceResult(address);
  const travelFee =
    result.distanceMiles != null ? computeTravelFee(result.distanceMiles) : 0;
  const geocoded = result.distanceSource !== "unavailable";

  return NextResponse.json({
    travelFee,
    distanceMiles: result.distanceMiles,
    geocoded,
    inputAddress: result.inputAddress,
    normalizedAddress: result.normalizedAddress,
    destinationLat: result.destinationLat,
    destinationLng: result.destinationLng,
    distanceSource: result.distanceSource,
    error: result.error,
  });
}
