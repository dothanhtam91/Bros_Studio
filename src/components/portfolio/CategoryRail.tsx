"use client";

import Link from "next/link";

const CATEGORIES = [
  "All",
  "Luxury",
  "Residential",
  "Condo",
  "Townhome",
  "Commercial",
  "Night",
] as const;

export function CategoryRail({ currentType }: { currentType: string | null }) {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8" aria-label="Filter by category">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/70 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md sm:px-5 sm:py-3.5">
          <div className="flex gap-1 overflow-x-auto py-1 scrollbar-hide sm:flex-wrap sm:justify-center sm:gap-2 sm:overflow-visible">
            {CATEGORIES.map((cat) => {
              const isActive =
                (currentType == null && cat === "All") ||
                currentType === cat.toLowerCase();
              return (
                <Link
                  key={cat}
                  href={cat === "All" ? "/portfolio" : `/portfolio?type=${cat.toLowerCase()}`}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/15 text-amber-900 shadow-sm ring-1 ring-amber-400/30"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
