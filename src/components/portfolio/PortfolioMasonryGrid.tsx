"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { PortfolioItem } from "./types";

const INITIAL = 24;
const LOAD_MORE = 12;

function spanClass(index: number) {
  if (index === 0) {
    return "md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[280px] lg:min-h-[340px]";
  }
  if (index === 1 || index === 2) {
    return "md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1 aspect-[4/3] md:aspect-auto md:min-h-[200px] lg:min-h-[220px]";
  }
  return "md:col-span-1 md:row-span-1 aspect-[4/3] md:min-h-[200px]";
}

export function PortfolioMasonryGrid({
  items,
  lightboxIndexOffset,
  onOpenGlobalIndex,
  filterKey,
}: {
  items: PortfolioItem[];
  lightboxIndexOffset: number;
  onOpenGlobalIndex: (globalIndex: number) => void;
  filterKey: string;
}) {
  const [visible, setVisible] = useState(INITIAL);
  const slice = items.slice(0, visible);
  const hasMore = visible < items.length;

  const openAt = useCallback(
    (localIndex: number) => {
      onOpenGlobalIndex(lightboxIndexOffset + localIndex);
    },
    [lightboxIndexOffset, onOpenGlobalIndex]
  );

  return (
    <section className="px-4 pb-6 sm:px-6 lg:px-8" aria-label="Gallery grid">
      <div className="mx-auto max-w-7xl">
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {slice.map((item, index) => (
              <motion.div
                key={`${filterKey}-${item.src}-${item.alt}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(index * 0.05, 0.6),
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                role="button"
                tabIndex={0}
                onClick={() => openAt(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openAt(index);
                  }
                }}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl ${spanClass(index)}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={item.unoptimized}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="translate-y-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow-lg backdrop-blur-sm transition-all duration-500 group-hover:translate-y-0">
                    View image
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {hasMore && (
          <div className="mt-12 flex justify-center sm:mt-14">
            <button
              type="button"
              onClick={() => setVisible((v) => v + LOAD_MORE)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white px-9 py-3 text-sm font-medium text-[#0F1115] shadow-sm transition duration-200 hover:border-[#D4A853]/40 hover:shadow-md"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
