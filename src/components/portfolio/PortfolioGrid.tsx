"use client";

import { useState, useCallback } from "react";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioLightbox } from "./PortfolioLightbox";
import { PortfolioEmptyState } from "./PortfolioEmptyState";
import type { PortfolioItem } from "./types";

export type { PortfolioItem } from "./types";

const INITIAL_REST = 12;
const LOAD_MORE = 12;

function EditorialOpening({
  items,
  openLightbox,
  indexOffset,
}: {
  items: [PortfolioItem, PortfolioItem, PortfolioItem];
  openLightbox: (item: PortfolioItem) => void;
  indexOffset: number;
}) {
  const [a, b, c] = items;
  return (
    <div className="group/edito relative mb-9 sm:mb-11 lg:mb-14">
      <div className="pointer-events-none absolute -left-4 top-8 hidden h-32 w-32 rounded-full bg-amber-100/25 blur-2xl lg:block" aria-hidden />
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-stretch lg:gap-7">
        <div className="w-full min-w-0 lg:w-[61%]">
          <div className="animate-portfolio-rise h-full min-h-[240px] lg:min-h-[440px]">
            <PortfolioCard
              src={a.src}
              alt={a.alt}
              unoptimized={a.unoptimized}
              index={indexOffset}
              variant="editorialHero"
              tier="hero"
              className="h-full"
              onClick={() => openLightbox(a)}
            />
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:flex lg:w-[39%] lg:flex-col lg:gap-5">
          <div className="min-h-0 transition-transform duration-500 ease-out lg:flex lg:flex-1 lg:flex-col lg:group-hover/edito:translate-x-0.5">
            <div className="animate-portfolio-rise h-full" style={{ animationDelay: "55ms" }}>
              <PortfolioCard
                src={b.src}
                alt={b.alt}
                unoptimized={b.unoptimized}
                index={indexOffset + 1}
                variant="editorialSupporting"
                tier="accent"
                className="h-full min-h-[190px] lg:min-h-0"
                onClick={() => openLightbox(b)}
              />
            </div>
          </div>
          <div className="min-h-0 transition-transform duration-500 ease-out lg:flex lg:flex-1 lg:flex-col lg:group-hover/edito:-translate-x-0.5">
            <div className="animate-portfolio-rise h-full" style={{ animationDelay: "105ms" }}>
              <PortfolioCard
                src={c.src}
                alt={c.alt}
                unoptimized={c.unoptimized}
                index={indexOffset + 2}
                variant="editorialSupporting"
                tier="accent"
                className="h-full min-h-[190px] lg:min-h-0"
                onClick={() => openLightbox(c)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioGrid({
  filteredItems,
  currentType,
  allItems,
  heroSkipCount,
  lightboxIndex,
  setLightboxIndex,
}: {
  filteredItems: PortfolioItem[];
  currentType: string | null;
  allItems: PortfolioItem[];
  heroSkipCount: number;
  lightboxIndex: number | null;
  setLightboxIndex: (i: number | null) => void;
}) {
  const isAllView = !currentType;
  const [visibleRestCount, setVisibleRestCount] = useState(INITIAL_REST);

  const afterHero = filteredItems.slice(heroSkipCount);
  const afterHeroVisible = afterHero.slice(0, visibleRestCount);
  const hasMore = visibleRestCount < afterHero.length;

  const openLightbox = useCallback(
    (item: PortfolioItem) => {
      const idx = filteredItems.findIndex((x) => x.src === item.src && x.alt === item.alt);
      setLightboxIndex(idx >= 0 ? idx : 0);
    },
    [filteredItems, setLightboxIndex]
  );

  if (!isAllView && filteredItems.length === 0) {
    const suggestions = allItems
      .filter((i) => i.category?.toLowerCase() !== currentType)
      .slice(0, 6);
    const filterMismatch = Boolean(currentType && allItems.length > 0);
    return (
      <>
        <PortfolioEmptyState
          category={currentType}
          suggestions={suggestions}
          filterMismatch={filterMismatch}
          totalInGallery={filterMismatch ? allItems.length : undefined}
          onSuggestionClick={(suggestionIdx: number) => {
            const sugg = suggestions[suggestionIdx];
            if (!sugg) return;
            const idx = allItems.findIndex((x) => x.src === sugg.src && x.alt === sugg.alt);
            setLightboxIndex(idx >= 0 ? idx : 0);
          }}
        />
        {lightboxIndex !== null && (
          <PortfolioLightbox
            items={allItems}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  if (isAllView && filteredItems.length === 0) {
    return (
      <PortfolioEmptyState
        category={null}
        suggestions={[]}
        filterMismatch={false}
        onSuggestionClick={undefined}
      />
    );
  }

  const showEditorial = afterHeroVisible.length >= 3;
  const editorialTriple = showEditorial
    ? ([afterHeroVisible[0], afterHeroVisible[1], afterHeroVisible[2]] as [
        PortfolioItem,
        PortfolioItem,
        PortfolioItem,
      ])
    : null;
  const gridItems = showEditorial ? afterHeroVisible.slice(3) : afterHeroVisible;
  const editorialBaseIndex = heroSkipCount;

  const filterKey = currentType ?? "all";
  const showGalleryRail = editorialTriple !== null || gridItems.length > 0;

  return (
    <>
      <section
        className="relative px-4 pb-14 pt-2 sm:px-6 sm:pb-16 sm:pt-4 lg:px-8"
        aria-label="Gallery"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent" aria-hidden />
        <div className="mx-auto max-w-[88rem] xl:max-w-[92rem]">
          <div key={filterKey}>
            {showGalleryRail && (
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 sm:mb-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
                  Selected frames
                </p>
                <p className="text-[11px] tabular-nums tracking-wide text-zinc-400">
                  {filteredItems.length} {filteredItems.length === 1 ? "image" : "images"}
                </p>
              </div>
            )}

            {editorialTriple && (
              <EditorialOpening
                items={editorialTriple}
                openLightbox={openLightbox}
                indexOffset={editorialBaseIndex}
              />
            )}

            {gridItems.length > 0 && (
              <div
                className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6 lg:gap-y-7 ${
                  showEditorial ? "border-t border-zinc-200/50 pt-9 sm:pt-10 lg:pt-12" : ""
                }`}
              >
                {gridItems.map((item, i) => {
                  const globalIndex = editorialBaseIndex + (showEditorial ? 3 : 0) + i;
                  return (
                    <div
                      key={`${item.src}-${item.alt}-${globalIndex}`}
                      className="animate-portfolio-rise"
                      style={{ animationDelay: `${Math.min(i * 42, 380)}ms` }}
                    >
                      <PortfolioCard
                        src={item.src}
                        alt={item.alt}
                        unoptimized={item.unoptimized}
                        index={globalIndex}
                        variant="tile"
                        tier="grid"
                        onClick={() => openLightbox(item)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {hasMore && (
            <div className="mt-12 flex justify-center sm:mt-14">
              <button
                type="button"
                onClick={() => setVisibleRestCount((v) => v + LOAD_MORE)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/90 bg-white px-9 py-3 text-sm font-medium text-zinc-700 shadow-[0_2px_12px_rgba(24,24,27,0.04)] transition duration-200 hover:border-amber-200/80 hover:bg-amber-50/40 hover:text-zinc-900 hover:shadow-md"
              >
                Load more
                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {lightboxIndex !== null && (
        <PortfolioLightbox
          items={filteredItems}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
