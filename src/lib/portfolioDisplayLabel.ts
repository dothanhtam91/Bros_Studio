/** Human-readable label for portfolio cards; avoids raw filenames when possible. */

function stripExtension(s: string): string {
  return s.replace(/\.(jpe?g|png|webp|gif|avif)$/i, "").trim();
}

function normalizeSpacing(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function capitalizeWords(s: string): string {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function looksGenericPortfolioAlt(s: string): boolean {
  return /^portfolio\s*\d+$/i.test(s);
}

/**
 * True when the string is not suitable as a luxury “project” title.
 */
export function shouldReplaceWithCategoryLabel(s: string): boolean {
  const t = normalizeSpacing(stripExtension(s));
  if (!t || t.length < 2) return true;
  if (looksLikeUuid(t)) return true;
  if (looksGenericPortfolioAlt(t)) return true;
  if (/^img[_\s]?\d+$/i.test(t)) return true;
  if (/^dsc[_\s]?\d+$/i.test(t)) return true;
  if (/^photo[_\s]?\d+$/i.test(t)) return true;
  return false;
}

export function formatPortfolioItemTitle(
  alt: string | undefined,
  title: string | undefined,
  category: string | undefined,
  index: number
): string {
  const raw = (title ?? alt ?? "").trim();
  const cleaned = capitalizeWords(normalizeSpacing(stripExtension(raw)));

  if (shouldReplaceWithCategoryLabel(cleaned)) {
    if (category) {
      const c = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      return `${c} collection`;
    }
    return `Project ${index + 1}`;
  }

  return cleaned;
}

export function formatCategoryLabel(category: string | undefined): string {
  if (!category) return "";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}
