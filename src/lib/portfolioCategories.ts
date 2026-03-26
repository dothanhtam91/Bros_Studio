/** Public studio portfolio filter categories (matches `/portfolio?type=`). */
export const STUDIO_PORTFOLIO_CATEGORIES = [
  { label: "Drone", value: "drone" },
  { label: "Interior", value: "interior" },
  { label: "Exterior", value: "exterior" },
  { label: "Twilight", value: "twilight" },
  { label: "Detailed", value: "detailed" },
] as const;

export type StudioPortfolioCategoryValue =
  (typeof STUDIO_PORTFOLIO_CATEGORIES)[number]["value"];

const SLUG_SET = new Set<string>(
  STUDIO_PORTFOLIO_CATEGORIES.map((c) => c.value)
);

export function isStudioPortfolioCategorySlug(
  v: string
): v is StudioPortfolioCategoryValue {
  return SLUG_SET.has(v.toLowerCase());
}

/** Normalize admin/API input to a valid slug; default when missing or invalid. */
export function parseStudioPortfolioCategory(
  raw: string | null | undefined,
  fallback: StudioPortfolioCategoryValue = "interior"
): StudioPortfolioCategoryValue {
  const v = raw?.trim().toLowerCase();
  if (v && isStudioPortfolioCategorySlug(v)) return v;
  return fallback;
}

/**
 * Studio public gallery: use DB folder_label when it is a known slug; otherwise infer from R2 key
 * (`portfolio/drone/uuid.jpg` → `drone`). Skips `portfolio/user/...` (personal uploads).
 */
export function resolveStudioPortfolioCategory(
  folder_label: string | null | undefined,
  normalizedR2Key: string
): string | undefined {
  const label = folder_label?.trim();
  if (label) {
    const lower = label.toLowerCase();
    if (isStudioPortfolioCategorySlug(lower)) return lower;
    if (lower !== "portfolio" && lower !== "my portfolio") {
      return lower;
    }
  }

  const k = normalizedR2Key.trim();
  const prefix = "portfolio/";
  const rest = k.startsWith(prefix) ? k.slice(prefix.length) : k;
  const segments = rest.split("/").filter(Boolean);
  const first = segments[0];
  if (!first || first === "user") return undefined;
  if (isStudioPortfolioCategorySlug(first)) return first;
  return undefined;
}
