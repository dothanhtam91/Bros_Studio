"use client";

import { useState, useMemo } from "react";
import { PortfolioCard, spanForIndex } from "./PortfolioCard";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { PortfolioEmptyState } from "./PortfolioEmptyState";

export type PortfolioItem = {
  src: string;
  alt: string;
  category?: string;
  title?: string;
  unoptimized: boolean;
};

const INITIAL_COUNT = 12;
const LOAD_MORE = 12;

export function PortfolioGrid({
  items: rawItems,
  currentType,
  allItems,
}: {
  items: PortfolioItem[];
  currentType: string | null;
  allItems: PortfolioItem[];
}) {
  const items = useMemo(
    () =>
      currentType && currentType !== "all"
        ? rawItems.filter((i) => i.category?.toLowerCase() === currentType)
        : rawItems,
    [rawItems, currentType]
  );

  const [visible, setVisible] = useState(INITIAL_COUNT);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  if (items.length === 0) {
    const suggestions = allItems
      .filter((i) => i.category?.toLowerCase() !== currentType)
      .slice(0, 6);
    return (
      <PortfolioEmptyState
        category={currentType}
        suggestions={suggestions}
        onSuggestionClick={(idx) => setLightboxIndex(idx)}
      />
    );
  }

  return (
    <>
      <section
        className="px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8"
        aria-label="Gallery"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-4">
            {shown.map((item, i) => (
              <div
                key={`${item.src}-${i}`}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 50, 350)}ms` }}
              >
                <PortfolioCard
                  src={item.src}
                  alt={item.alt}
                  category={item.category}
                  span={spanForIndex(i, items.length)}
                  unoptimized={item.unoptimized}
                  index={i}
                  onClick={() => setLightboxIndex(i)}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + LOAD_MORE)}
                className="rounded-xl border border-zinc-200/80 bg-white px-8 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </section>

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
