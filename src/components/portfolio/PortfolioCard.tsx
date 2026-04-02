"use client";

import Image from "next/image";
import { useState } from "react";

export type PortfolioCardVariant = "tile" | "editorialHero" | "editorialSupporting";

/** Visual weight: hero = main spotlight, accent = secondary stack, grid = standard tiles */
export type PortfolioCardTier = "grid" | "hero" | "accent";

export function PortfolioCard({
  src,
  unoptimized,
  index,
  onClick,
  variant = "tile",
  className = "",
  tier = "grid",
}: {
  src: string;
  /** Preserved for callers; image is decorative next to the button label. */
  alt: string;
  unoptimized: boolean;
  index: number;
  onClick: () => void;
  variant?: PortfolioCardVariant;
  className?: string;
  tier?: PortfolioCardTier;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const isTile = variant === "tile";

  const innerClass = isTile
    ? "relative w-full aspect-[4/3] sm:aspect-[5/4]"
    : variant === "editorialHero"
      ? "relative w-full min-h-[260px] flex-1 lg:min-h-[460px]"
      : "relative w-full min-h-[180px] flex-1 lg:min-h-0";

  const sizes =
    variant === "editorialHero"
      ? "(max-width: 1024px) 100vw, 58vw"
      : variant === "editorialSupporting"
        ? "(max-width: 1024px) 50vw, 22vw"
        : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 28vw";

  const tierShell =
    tier === "hero"
      ? "rounded-[1.35rem] shadow-[0_28px_56px_-20px_rgba(24,24,27,0.22)] ring-1 ring-white/50"
      : tier === "accent"
        ? "rounded-2xl shadow-[0_16px_40px_-16px_rgba(24,24,27,0.14)] ring-[3px] ring-white/95"
        : "rounded-2xl shadow-sm ring-1 ring-zinc-200/50";

  const motionClass =
    tier === "grid"
      ? "duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(24,24,27,0.12)] hover:ring-zinc-200/70"
      : "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_32px_64px_-24px_rgba(24,24,27,0.18)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden bg-zinc-200/90 text-left transition-all ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${tierShell} ${isTile ? "" : "flex h-full min-h-0 flex-col"} ${motionClass} ${className}`}
      aria-label="Open photo"
    >
      <div className={innerClass}>
        {!failed && (
          <Image
            src={src}
            alt=""
            fill
            className={`object-cover transition-all duration-[750ms] ease-out group-hover:scale-[1.04] ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            sizes={sizes}
            loading={index < 4 ? "eager" : "lazy"}
            unoptimized={unoptimized}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}

        {!loaded && !failed && (
          <div className="image-loading-shimmer absolute inset-0" aria-hidden />
        )}

        {failed && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-200 px-4"
            aria-hidden
          >
            <svg
              className="h-8 w-8 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
            <span className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Image unavailable
            </span>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/25 via-transparent to-stone-950/[0.02] opacity-80 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-stone-950/0 transition-colors duration-300 group-hover:bg-stone-950/[0.04]"
          aria-hidden
        />
      </div>
    </button>
  );
}
