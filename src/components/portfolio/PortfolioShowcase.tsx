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
      className="px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8"
      aria-label="Gallery"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-7">
          {items.slice(0, 12).map((item, i) => (
            <div
              key={`${item.src}-${i}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
            >
              <ShowcaseTile
                src={item.src}
                alt={item.alt}
                size={getSize(i)}
                unoptimized={item.unoptimized}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
