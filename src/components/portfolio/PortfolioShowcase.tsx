"use client";

import { ShowcaseTile } from "./ShowcaseTile";
import { PortfolioEmptyShowcase } from "./PortfolioEmptyShowcase";

type Size = "featured" | "medium" | "small";

function getSize(index: number): Size {
  if (index === 0) return "featured";
  if (index <= 2) return "medium";
  return "small";
}

type PortfolioItem = {
  src: string;
  alt: string;
  category?: string;
  title?: string;
  unoptimized: boolean;
};

export function PortfolioShowcase({
  items: rawItems,
  currentType,
}: {
  items: PortfolioItem[];
  currentType: string | null;
}) {
  const items =
    currentType && currentType !== "all"
      ? rawItems.filter(
          (i) => i.category?.toLowerCase() === currentType
        )
      : rawItems;

  const hasItems = items.length > 0;

  if (!hasItems) {
    return <PortfolioEmptyShowcase />;
  }

  return (
    <section
      className="relative border-t border-zinc-200/60 px-4 py-12 sm:px-6 sm:py-14 lg:px-8"
      aria-label="Gallery"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Collection
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {items.slice(0, 12).map((item, i) => (
            <ShowcaseTile
              key={`${item.src}-${i}`}
              src={item.src}
              alt={item.alt}
              size={getSize(i)}
              category={item.category}
              title={item.title}
              unoptimized={item.unoptimized}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
