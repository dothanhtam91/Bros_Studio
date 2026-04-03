import type { StudioPortfolioCategoryValue } from "@/lib/portfolioCategories";
import { isStudioPortfolioCategorySlug } from "@/lib/portfolioCategories";

/** Minimal shape for hero image selection (matches portfolio items). */
export type PortfolioHeroPickItem = {
  src: string;
  alt: string;
  category?: string;
};

/** URL filter slug or whole gallery */
export type PortfolioHeroCategoryKey = "all" | StudioPortfolioCategoryValue;

export type PortfolioHeroVisualConfig = {
  eyebrow: string;
  headline: string;
  subtext: string;
  /** Bottom-heavy gradient (readability for text block). */
  overlayBottomClass: string;
  /** Left vignette so headlines sit on stable tone without crushing the image. */
  overlaySideClass: string;
};

/**
 * Single source of truth for portfolio hero copy and overlay mood per filter.
 * Stronger overlays for bright scenes; lighter for twilight so depth remains.
 */
export const PORTFOLIO_HERO_BY_CATEGORY: Record<
  PortfolioHeroCategoryKey,
  PortfolioHeroVisualConfig
> = {
  all: {
    eyebrow: "Portfolio",
    headline: "Images that sell the space",
    subtext: "Clean visuals designed to make every listing stand out.",
    overlayBottomClass: "bg-gradient-to-t from-[#0a0c10]/95 via-[#0a0c10]/52 to-[#0a0c10]/20",
    overlaySideClass: "bg-gradient-to-r from-[#0a0c10]/58 via-[#0a0c10]/12 to-transparent",
  },
  drone: {
    eyebrow: "Drone",
    headline: "Showcase the full property story",
    subtext:
      "Elevated perspectives that reveal land, layout, and location at a glance.",
    overlayBottomClass: "bg-gradient-to-t from-[#0a0c10]/92 via-[#0a0c10]/48 to-[#0a0c10]/18",
    overlaySideClass: "bg-gradient-to-r from-[#0a0c10]/62 via-[#0a0c10]/14 to-transparent",
  },
  interior: {
    eyebrow: "Interior",
    headline: "Bright, balanced, and inviting interiors",
    subtext: "Composed to highlight flow, natural light, and the feeling of home.",
    overlayBottomClass: "bg-gradient-to-t from-[#0a0c10]/96 via-[#0a0c10]/58 to-[#0a0c10]/22",
    overlaySideClass: "bg-gradient-to-r from-[#0a0c10]/68 via-[#0a0c10]/18 to-transparent",
  },
  exterior: {
    eyebrow: "Exterior",
    headline: "First impressions that draw buyers in",
    subtext:
      "Crisp exterior imagery that gives every listing a stronger curb appeal presence.",
    overlayBottomClass: "bg-gradient-to-t from-[#0a0c10]/94 via-[#0a0c10]/50 to-[#0a0c10]/18",
    overlaySideClass: "bg-gradient-to-r from-[#0a0c10]/56 via-transparent to-transparent",
  },
  twilight: {
    eyebrow: "Twilight",
    headline: "Atmosphere that feels cinematic",
    subtext:
      "Evening visuals crafted to add warmth, emotion, and luxury to the property.",
    overlayBottomClass: "bg-gradient-to-t from-[#0F1115]/72 via-[#0F1115]/26 to-[#1a1522]/28",
    overlaySideClass: "bg-gradient-to-r from-[#0F1115]/42 via-transparent to-[#0F1115]/15",
  },
  detailed: {
    eyebrow: "Details",
    headline: "The finishes buyers remember",
    subtext:
      "Close-up compositions that capture craftsmanship, texture, and design character.",
    overlayBottomClass: "bg-gradient-to-t from-[#0a0c10]/93 via-[#0a0c10]/54 to-[#0a0c10]/20",
    overlaySideClass: "bg-gradient-to-r from-[#0a0c10]/64 via-[#0a0c10]/16 to-transparent",
  },
};

export function getPortfolioHeroCopy(key: PortfolioHeroCategoryKey): PortfolioHeroVisualConfig {
  return PORTFOLIO_HERO_BY_CATEGORY[key] ?? PORTFOLIO_HERO_BY_CATEGORY.all;
}

export function toHeroCategoryKey(currentType: string | null): PortfolioHeroCategoryKey {
  if (!currentType) return "all";
  if (isStudioPortfolioCategorySlug(currentType)) return currentType;
  return "all";
}

const CATEGORY_PICK_ORDER: StudioPortfolioCategoryValue[] = [
  "drone",
  "interior",
  "exterior",
  "twilight",
  "detailed",
];

function itemKey(i: PortfolioHeroPickItem): string {
  return `${i.src}|${i.alt}`;
}

/**
 * Hero slides: category uses first images from that filter; "All" diversifies across categories when possible.
 */
export function pickHeroSlideItems<T extends PortfolioHeroPickItem>(
  allItems: T[],
  filteredItems: T[],
  key: PortfolioHeroCategoryKey,
  max = 3
): T[] {
  if (key !== "all") {
    return filteredItems.slice(0, Math.min(max, filteredItems.length));
  }

  const picked: T[] = [];
  const used = new Set<string>();

  for (const cat of CATEGORY_PICK_ORDER) {
    if (picked.length >= max) break;
    const found = allItems.find(
      (i) => i.category?.toLowerCase() === cat && !used.has(itemKey(i))
    );
    if (found) {
      picked.push(found);
      used.add(itemKey(found));
    }
  }

  for (const i of allItems) {
    if (picked.length >= max) break;
    if (!used.has(itemKey(i))) {
      picked.push(i);
      used.add(itemKey(i));
    }
  }

  return picked;
}
