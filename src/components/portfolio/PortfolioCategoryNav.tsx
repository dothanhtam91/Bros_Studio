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

export function PortfolioCategoryNav({
  currentType,
}: {
  currentType: string | null;
}) {
  return (
    <section
      className="relative border-t border-zinc-200/60 bg-zinc-50/50 px-4 py-5 sm:px-6 lg:px-8"
      aria-label="Filter collection"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Explore by type
        </p>
        <div className="rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.03)] backdrop-blur-sm">
          <div className="flex gap-1 overflow-x-auto py-0.5 scrollbar-hide sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
            {CATEGORIES.map((cat) => {
              const isActive =
                (currentType == null && cat === "All") ||
                currentType === cat.toLowerCase();
              return (
                <Link
                  key={cat}
                  href={
                    cat === "All"
                      ? "/portfolio"
                      : `/portfolio?type=${cat.toLowerCase()}`
                  }
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/12 text-amber-900 ring-1 ring-amber-400/25"
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
