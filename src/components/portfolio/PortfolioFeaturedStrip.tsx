"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { formatPortfolioItemTitle } from "@/lib/portfolioDisplayLabel";
import type { PortfolioItem } from "./types";

export function PortfolioFeaturedStrip({
  entries,
  onOpenGlobalIndex,
}: {
  entries: { item: PortfolioItem; globalIndex: number }[];
  onOpenGlobalIndex: (globalIndex: number) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <section className="border-t border-gray-100 bg-white py-20 sm:py-24">
      <div className="mx-auto mb-10 flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:px-6 md:flex-row md:items-end lg:px-8">
        <div>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-[#0F1115] md:text-4xl">
            Selected frames
          </h2>
          <p className="text-lg font-light text-gray-500">A curated look at standout shots.</p>
        </div>
        <Link
          href="/book"
          className="flex items-center gap-1 text-sm font-medium text-[#0F1115] transition-colors hover:text-[#D4A853]"
        >
          Book a shoot
          <ChevronRight size={16} aria-hidden />
        </Link>
      </div>

      <div className="w-full cursor-grab overflow-x-auto pb-10 active:cursor-grabbing scrollbar-hide">
        <div className="mx-auto flex w-max gap-6 px-4 md:gap-8 md:px-12">
          {entries.map(({ item, globalIndex }, i) => {
            const title = formatPortfolioItemTitle(
              item.alt,
              item.title,
              item.category,
              globalIndex
            );
            return (
              <motion.div
                key={`${item.src}-${globalIndex}`}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.75, delay: i * 0.08, ease: "easeOut" }}
                role="button"
                tabIndex={0}
                onClick={() => onOpenGlobalIndex(globalIndex)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenGlobalIndex(globalIndex);
                  }
                }}
                className="group relative aspect-[16/9] w-[85vw] shrink-0 overflow-hidden rounded-2xl shadow-sm transition-all duration-700 hover:shadow-2xl md:w-[700px]"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 85vw, 700px"
                  unoptimized={item.unoptimized}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-8 left-8 translate-y-4 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <h3 className="text-2xl font-medium tracking-tight">{title}</h3>
                  <p className="mt-1 text-sm font-light text-white/80">View image</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
