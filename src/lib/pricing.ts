/**
 * Centralized pricing logic for BrosStudio.
 * Package tiers, Haversine distance, travel fee, AirBnB surcharge, and totals.
 */

// Katy, TX 77449 base location (fixed origin for distance/travel)
export const KATY_TX = { lat: 29.8177, lng: -95.749 };

export interface PackageTier {
  id: string;
  sqftMin: number;
  sqftMax: number | null; // null = no max
  photoRange: string;
  priceCents: number;
  /** Optional badge: "Most popular", "Best value", "Large homes" */
  badge?: string;
  /** Optional one-line description for the card */
  description?: string;
  /** For tier 6: display base as $180+ and show this compact note */
  extraPhotoRule?: string;
  /** If true, show price with "+" (e.g. $180+) */
  priceIsFrom?: boolean;
}

/** Single source of truth for package pricing */
export const PACKAGE_TIERS: PackageTier[] = [
  { id: "1", sqftMin: 0, sqftMax: 999, photoRange: "~20 photos", priceCents: 12000, description: "Condos & small listings" },
  { id: "2", sqftMin: 1000, sqftMax: 1499, photoRange: "25–30 photos", priceCents: 13500 },
  { id: "3", sqftMin: 1500, sqftMax: 1999, photoRange: "32–35 photos", priceCents: 15000, badge: "Most popular" },
  { id: "4", sqftMin: 2000, sqftMax: 2499, photoRange: "41–45 photos", priceCents: 16500 },
  { id: "5", sqftMin: 2500, sqftMax: 2999, photoRange: "45–50 photos", priceCents: 18000, badge: "Best value" },
  {
    id: "6",
    sqftMin: 3000,
    sqftMax: null,
    photoRange: "50+ photos",
    priceCents: 18000,
    badge: "Large homes",
    extraPhotoRule: "+$20 per 5 extra photos",
    priceIsFrom: true,
  },
];

export function getPackageBySqft(sqft: number): PackageTier | undefined {
  const n = Number(sqft) || 0;
  return PACKAGE_TIERS.find(
    (t) => n >= t.sqftMin && (t.sqftMax == null || n <= t.sqftMax)
  );
}

export function getPackageById(id: string): PackageTier | undefined {
  return PACKAGE_TIERS.find((t) => t.id === id);
}

/** Haversine formula: distance in miles between two lat/lng points */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Travel fee: 0 if distance ≤ 20 miles, else (distance - 20) * 1.8 */
export function computeTravelFee(distanceMiles: number): number {
  if (distanceMiles <= 20) return 0;
  return roundMoney((distanceMiles - 20) * 1.8);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PricingInput {
  packageId: string;
  sqFt?: number;
  isAirbnb?: boolean;
  travelFee?: number;
  additionalRequestFee?: number;
}

export interface PricingBreakdown {
  basePackageCents: number;
  basePackage: number;
  airbnbSurchargeCents: number;
  airbnbSurcharge: number;
  adjustedPackageCents: number;
  adjustedPackage: number;
  travelFee: number;
  additionalRequestFee: number;
  total: number;
}

/** Compute full pricing breakdown. Money values rounded to 2 decimals. */
export function computePricingBreakdown(input: PricingInput): PricingBreakdown {
  const pkg = getPackageById(input.packageId);
  const baseCents = pkg?.priceCents ?? 0;
  const airbnb = input.isAirbnb ? baseCents * 0.2 : 0;
  const adjustedCents = baseCents + airbnb;
  const travel = roundMoney(input.travelFee ?? 0);
  const additional = roundMoney(input.additionalRequestFee ?? 0);

  const total = roundMoney(
    adjustedCents / 100 + travel + additional
  );

  return {
    basePackageCents: baseCents,
    basePackage: roundMoney(baseCents / 100),
    airbnbSurchargeCents: Math.round(airbnb),
    airbnbSurcharge: roundMoney(airbnb / 100),
    adjustedPackageCents: adjustedCents,
    adjustedPackage: roundMoney(adjustedCents / 100),
    travelFee: travel,
    additionalRequestFee: additional,
    total,
  };
}
