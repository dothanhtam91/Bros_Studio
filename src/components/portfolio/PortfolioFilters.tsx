"use client";

import Link from "next/link";
import { STUDIO_PORTFOLIO_CATEGORIES } from "@/lib/portfolioCategories";

const CATEGORIES = [
  { label: "All", value: null as null },
  ...STUDIO_PORTFOLIO_CATEGORIES,
] as const;

export function PortfolioFilters({ currentType }: { currentType: string | null }) {
  return (
    <section
      className="sticky top-16 z-30 border-b border-zinc-200/60 bg-[var(--background)]/95 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-3.5 lg:px-8"
      aria-label="Filter collection"
    >
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto py-0.5 scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {CATEGORIES.map((cat) => {
          const isActive =
            (currentType == null && cat.value == null) ||
            currentType === cat.value;
          return (
            <Link
              key={cat.label}
              href={cat.value == null ? "/portfolio" : `/portfolio?type=${cat.value}`}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                isActive
                  ? "border border-amber-200/90 bg-amber-50 text-stone-800 shadow-sm"
                  : "border border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-white hover:text-zinc-900"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
