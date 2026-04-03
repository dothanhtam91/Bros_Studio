"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { STUDIO_PORTFOLIO_CATEGORIES } from "@/lib/portfolioCategories";

const CATEGORIES = [
  { label: "All", value: null as null },
  ...STUDIO_PORTFOLIO_CATEGORIES,
] as const;

export function PortfolioZipFilters({ currentType }: { currentType: string | null }) {
  return (
    <div className="flex justify-center px-4 py-12 sm:py-14">
      <div className="inline-flex max-w-full items-center overflow-x-auto rounded-full border border-zinc-200/80 bg-white/75 p-1.5 shadow-[0_2px_24px_rgba(24,24,27,0.06)] backdrop-blur-xl scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive =
            (currentType == null && cat.value == null) || currentType === cat.value;
          return (
            <Link
              key={cat.label}
              href={cat.value == null ? "/portfolio" : `/portfolio?type=${cat.value}`}
              scroll={false}
              className={`relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition-all duration-300 ${
                isActive
                  ? "font-semibold tracking-tight text-zinc-900"
                  : "font-medium text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="portfolioZipActiveTab"
                  className="absolute inset-0 rounded-full border border-amber-400/25 bg-white shadow-[0_2px_14px_rgba(212,168,83,0.14)] ring-1 ring-zinc-900/[0.04]"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
