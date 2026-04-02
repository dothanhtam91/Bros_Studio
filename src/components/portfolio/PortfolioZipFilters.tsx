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
    <div className="flex justify-center px-4 py-14 sm:py-16">
      <div className="inline-flex max-w-full items-center overflow-x-auto rounded-full border border-gray-200/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-xl scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive =
            (currentType == null && cat.value == null) || currentType === cat.value;
          return (
            <Link
              key={cat.label}
              href={cat.value == null ? "/portfolio" : `/portfolio?type=${cat.value}`}
              scroll={false}
              className={`relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                isActive ? "text-[#0F1115]" : "text-gray-500 hover:scale-105 hover:text-[#0F1115]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="portfolioZipActiveTab"
                  className="absolute inset-0 rounded-full border border-[#D4A853]/20 bg-white shadow-[0_2px_8px_rgba(212,168,83,0.15)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.55 }}
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
