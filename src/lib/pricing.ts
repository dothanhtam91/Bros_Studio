export interface PackageItem {
  id: string;
  name: string;
  price_cents: number;
  photo_count: number;
  video_included: boolean;
  description: string;
  features: string[];
}

export interface AddOnItem {
  id: string;
  name: string;
  price_cents: number;
  description: string;
}

export const PACKAGES: PackageItem[] = [
  {
    id: "basic",
    name: "Basic",
    price_cents: 19900,
    photo_count: 20,
    video_included: false,
    description: "Essential listing coverage",
    features: ["20 edited photos", "MLS-ready", "24–48h turnaround"],
  },
  {
    id: "standard",
    name: "Standard",
    price_cents: 34900,
    photo_count: 35,
    video_included: true,
    description: "Most popular for agents",
    features: ["35 edited photos", "Walkthrough video", "MLS + web sizes", "24–48h turnaround"],
  },
  {
    id: "luxury",
    name: "Luxury",
    price_cents: 54900,
    photo_count: 50,
    video_included: true,
    description: "Full premium coverage",
    features: ["50 edited photos", "Walkthrough + reels", "MLS + web + print", "Priority 24h delivery"],
  },
];

export const ADDONS: AddOnItem[] = [
  { id: "twilight", name: "Twilight / Dusk", price_cents: 7500, description: "Exterior dusk shots" },
  { id: "drone", name: "Drone", price_cents: 9900, description: "Aerial photos + video" },
  { id: "reels", name: "Social Reels", price_cents: 4900, description: "Short-form social clips" },
  { id: "rush", name: "Rush delivery", price_cents: 4900, description: "24h turnaround" },
  { id: "virtual_staging", name: "Virtual staging", price_cents: 9900, description: "Per room" },
  { id: "declutter", name: "Declutter edit", price_cents: 3900, description: "AI declutter" },
  { id: "floor_plan", name: "Floor plan", price_cents: 2900, description: "2D floor plan" },
];

export function getPackage(id: string): PackageItem | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function getAddOn(id: string): AddOnItem | undefined {
  return ADDONS.find((a) => a.id === id);
}

export function computeQuote(packageId: string, addonIds: string[]): number {
  const pkg = getPackage(packageId);
  if (!pkg) return 0;
  let total = pkg.price_cents;
  for (const id of addonIds) {
    const addon = getAddOn(id);
    if (addon) total += addon.price_cents;
  }
  return total;
}
