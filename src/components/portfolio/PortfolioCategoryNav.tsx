"use client";

import Link from "next/link";

const CATEGORIES = [
  { label: "All", value: null },
  { label: "Drone", value: "drone" },
  { label: "Interior", value: "interior" },
  { label: "Exterior", value: "exterior" },
  { label: "Twilight", value: "twilight" },
  { label: "Detailed", value: "detailed" },
] as const;

export function PortfolioCategoryNav({
  currentType,
}: {
  currentType: string | null;
}) {
  return (
    <section
      className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8"
      aria-label="Filter collection"
    >
      <div className="mx-auto max-w-6xl animate-fade-in-up">
        <div className="flex gap-2 overflow-x-auto py-0.5 scrollbar-hide sm:flex-wrap sm:overflow-visible">
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
                    : "border border-transparent bg-white/70 text-zinc-600 hover:border-zinc-200 hover:bg-white hover:text-zinc-900"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
