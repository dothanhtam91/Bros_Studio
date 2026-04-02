"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { isStudioPortfolioCategorySlug } from "@/lib/portfolioCategories";
import { PortfolioCinemaHero } from "./PortfolioCinemaHero";
import { PortfolioZipFilters } from "./PortfolioZipFilters";
import { PortfolioMasonryGrid } from "./PortfolioMasonryGrid";
import { PortfolioFeaturedStrip } from "./PortfolioFeaturedStrip";
import { PortfolioEmptyState } from "./PortfolioEmptyState";
import { PortfolioLightbox } from "./PortfolioLightbox";
import type { PortfolioItem } from "./types";

export type { PortfolioItem } from "./types";

export function PortfolioPageClient({ items }: { items: PortfolioItem[] }) {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type")?.trim().toLowerCase() ?? "";
  const currentType =
    rawType.length > 0 && isStudioPortfolioCategorySlug(rawType) ? rawType : null;

  const filteredItems = useMemo(() => {
    if (!currentType) return items;
    return items.filter((i) => i.category?.toLowerCase() === currentType);
  }, [items, currentType]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const heroSource = useMemo(() => {
    if (items.length === 0) return [];
    if (filteredItems.length > 0) {
      return filteredItems.slice(0, Math.min(3, filteredItems.length));
    }
    return items.slice(0, Math.min(3, items.length));
  }, [items, filteredItems]);

  const gridItems = filteredItems.length > 3 ? filteredItems.slice(3) : [];

  const featuredEntries = useMemo(() => {
    if (filteredItems.length < 8) return [];
    const n = filteredItems.length;
    return filteredItems.slice(-4).map((item, i) => ({
      item,
      globalIndex: n - 4 + i,
    }));
  }, [filteredItems]);

  const openFromSuggestion = useCallback(
    (suggestionIdx: number, suggestions: PortfolioItem[]) => {
      const sugg = suggestions[suggestionIdx];
      if (!sugg) return;
      const idx = items.findIndex((x) => x.src === sugg.src && x.alt === sugg.alt);
      setLightboxIndex(idx >= 0 ? idx : 0);
    },
    [items]
  );

  const filterKey = currentType ?? "all";
  const heroKey = heroSource.map((s) => s.src).join("|");

  if (!currentType && items.length === 0) {
    return (
      <div className="bg-[#FAFAFA] pb-8">
        <PortfolioZipFilters currentType={null} />
        <PortfolioEmptyState
          category={null}
          suggestions={[]}
          filterMismatch={false}
          onSuggestionClick={undefined}
        />
      </div>
    );
  }

  if (currentType && filteredItems.length === 0 && items.length > 0) {
    const suggestions = items
      .filter((i) => i.category?.toLowerCase() !== currentType)
      .slice(0, 6);
    return (
      <>
        {heroSource.length > 0 && (
          <PortfolioCinemaHero key={heroKey} items={heroSource} />
        )}
        <div className="bg-[#FAFAFA] text-[#0F1115]">
          <PortfolioZipFilters currentType={currentType} />
          <PortfolioEmptyState
            category={currentType}
            suggestions={suggestions}
            filterMismatch
            totalInGallery={items.length}
            onSuggestionClick={(i) => openFromSuggestion(i, suggestions)}
          />
        </div>
        {lightboxIndex !== null && (
          <PortfolioLightbox
            items={items}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {heroSource.length > 0 && (
        <PortfolioCinemaHero key={heroKey} items={heroSource} />
      )}
      <div className="bg-[#FAFAFA] text-[#0F1115] selection:bg-[#D4A853]/30">
        <PortfolioZipFilters currentType={currentType} />
        {gridItems.length > 0 && (
          <PortfolioMasonryGrid
            key={filterKey}
            items={gridItems}
            lightboxIndexOffset={3}
            onOpenGlobalIndex={(i) => setLightboxIndex(i)}
            filterKey={filterKey}
          />
        )}
        {featuredEntries.length > 0 && (
          <PortfolioFeaturedStrip
            entries={featuredEntries}
            onOpenGlobalIndex={(i) => setLightboxIndex(i)}
          />
        )}
      </div>
      {lightboxIndex !== null && filteredItems.length > 0 && (
        <PortfolioLightbox
          items={filteredItems}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
