"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  getPortfolioHeroCopy,
  type PortfolioHeroCategoryKey,
} from "@/lib/portfolioHeroConfig";
import type { PortfolioItem } from "./types";

const ROTATE_MS = 6500;
const IMG_DURATION = 0.48;
const TEXT_DURATION = 0.42;
const STAGGER = 0.07;
const EASE = [0.25, 0.1, 0.25, 1] as const;

const textContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER, delayChildren: 0.12 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: EASE },
  },
};

const textItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: TEXT_DURATION, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.26, ease: EASE },
  },
};

export function PortfolioCinemaHero({
  categoryKey,
  items,
}: {
  categoryKey: PortfolioHeroCategoryKey;
  items: PortfolioItem[];
}) {
  const copy = getPortfolioHeroCopy(categoryKey);
  const slides = items.slice(0, Math.min(3, items.length));
  const slideSig = slides.map((s) => s.src).join("|");
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset carousel index when filter or slide set changes (avoid full remount so image crossfade can run)
    setCurrent(0);
  }, [categoryKey, slideSig]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [slides.length, slideSig]);

  useEffect(() => {
    if (typeof document === "undefined" || !slideSig) return;
    const toPreload = items.slice(0, Math.min(3, items.length));
    for (const s of toPreload) {
      const img = new window.Image();
      img.src = s.src;
    }
  }, [slideSig, items]);

  if (slides.length === 0) {
    return (
      <div className="relative min-h-[min(76vh,820px)] w-full bg-[#0F1115] pt-16">
        <div className={`absolute inset-0 top-16 ${copy.overlayBottomClass}`} />
        <div className={`absolute inset-0 top-16 ${copy.overlaySideClass}`} />
        <div className="relative z-10 flex min-h-[min(76vh,820px)] items-center px-4 pb-14 pt-6 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <HeroTextBlock copy={copy} categoryKey={categoryKey} />
          </div>
        </div>
      </div>
    );
  }

  const active = slides[current]!;

  return (
    <div className="relative min-h-[min(80vh,900px)] w-full overflow-hidden bg-[#0F1115] pt-16">
      <div className="absolute inset-0 top-16">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={`${categoryKey}-${active.src}-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: IMG_DURATION, ease: EASE }}
            className="absolute inset-0 overflow-hidden"
          >
            <motion.div
              className="relative h-full w-full"
              initial={{ scale: 1 }}
              animate={{ scale: 1.045 }}
              transition={{
                duration: 20,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Image
                src={active.src}
                alt={active.alt}
                fill
                className="object-cover object-center"
                sizes="100vw"
                priority={current === 0}
                unoptimized={active.unoptimized}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={`pointer-events-none absolute inset-0 top-16 ${copy.overlayBottomClass}`} />
      <div className={`pointer-events-none absolute inset-0 top-16 ${copy.overlaySideClass}`} />

      <div className="relative z-10 flex min-h-[min(80vh,900px)] items-center px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <HeroTextBlock copy={copy} categoryKey={categoryKey} />
        </div>
      </div>
    </div>
  );
}

function HeroTextBlock({
  copy,
  categoryKey,
}: {
  copy: ReturnType<typeof getPortfolioHeroCopy>;
  categoryKey: PortfolioHeroCategoryKey;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={categoryKey}
        className="max-w-[min(100%,36rem)] text-white lg:max-w-2xl"
        variants={textContainer}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.p
          variants={textItem}
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 sm:mb-4 sm:text-xs"
        >
          {copy.eyebrow}
        </motion.p>
        <motion.h1
          variants={textItem}
          className="mb-5 text-balance text-3xl font-semibold leading-[1.12] tracking-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
        >
          {copy.headline}
        </motion.h1>
        <motion.p
          variants={textItem}
          className="max-w-md text-pretty text-base font-light leading-relaxed text-white/88 sm:text-lg"
        >
          {copy.subtext}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
