"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { PortfolioItem } from "./types";

const ROTATE_MS = 6000;

export function PortfolioCinemaHero({ items }: { items: PortfolioItem[] }) {
  const slides = items.slice(0, Math.min(3, items.length));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative min-h-[70vh] w-full bg-[#0F1115] pt-16">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/80 to-transparent" />
      </div>
    );
  }

  const active = slides[current]!;

  return (
    <div className="relative min-h-[min(80vh,900px)] w-full overflow-hidden bg-[#0F1115] pt-16">
      <AnimatePresence mode="sync">
        <motion.div
          key={active.src + current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 top-16"
        >
          <Image
            src={active.src}
            alt={active.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized={active.unoptimized}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 top-16 bg-gradient-to-t from-[#0F1115]/90 via-[#0F1115]/35 to-[#0F1115]/50" />

      <div className="relative z-10 flex min-h-[min(80vh,900px)] items-center px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: "easeOut" }}
            className="max-w-2xl text-white"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 sm:text-sm">
              Portfolio
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Images that sell the space
            </h1>
            <p className="max-w-lg text-lg font-light text-white/90 md:text-xl">
              Clean visuals designed to make every listing stand out.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
