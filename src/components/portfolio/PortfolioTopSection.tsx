"use client";

import { PortfolioFilterPills } from "./PortfolioFilterPills";
import { PortfolioCard } from "./PortfolioCard";
import type { PortfolioItem } from "./types";

export function PortfolioTopSection({
  heroItems,
  currentType,
  onOpenItem,
}: {
  heroItems: PortfolioItem[];
  currentType: string | null;
  onOpenItem: (item: PortfolioItem) => void;
}) {
  return (
    <header className="relative overflow-hidden px-4 pb-10 pt-1 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
      <div
        className="pointer-events-none absolute inset-0 section-noise opacity-[0.45]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-[min(55vh,520px)] w-[min(90vw,640px)] rounded-full bg-gradient-to-bl from-amber-100/35 via-amber-50/10 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-zinc-200/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[88rem] xl:max-w-[92rem]">
        <div className="grid items-start gap-10 lg:grid-cols-5 lg:gap-12 xl:gap-14">
          <div className="flex flex-col lg:col-span-2 lg:max-w-lg lg:pt-2 xl:max-w-xl">
            <div className="relative pl-5 sm:pl-6">
              <span
                className="absolute left-0 top-1 h-[4.5rem] w-px bg-gradient-to-b from-amber-400/70 via-amber-300/35 to-transparent sm:h-[5.5rem]"
                aria-hidden
              />
              <p className="animate-portfolio-rise text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
                Portfolio
              </p>
              <h1
                className="animate-portfolio-rise mt-4 text-balance text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.025em] text-zinc-900 sm:text-[2rem] lg:text-[2.15rem] xl:text-[2.65rem] xl:leading-[1.08]"
                style={{ animationDelay: "45ms" }}
              >
                Images that sell the space
              </h1>
              <p
                className="animate-portfolio-rise mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-zinc-600 sm:text-[15px] lg:leading-[1.65]"
                style={{ animationDelay: "85ms" }}
              >
                Clean visuals made to help every listing stand out.
              </p>
            </div>
            <div className="animate-portfolio-rise mt-9 sm:mt-10" style={{ animationDelay: "125ms" }}>
              <PortfolioFilterPills currentType={currentType} />
            </div>
          </div>

          <div className="min-w-0 lg:col-span-3">
            <HeroVisualCluster items={heroItems} onOpenItem={onOpenItem} />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroVisualCluster({
  items,
  onOpenItem,
}: {
  items: PortfolioItem[];
  onOpenItem: (item: PortfolioItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div
        className="animate-portfolio-rise relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-zinc-100/90 to-zinc-200/60 ring-1 ring-zinc-200/70 sm:min-h-[320px] lg:min-h-[420px]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.03)_100%)]" />
      </div>
    );
  }

  if (items.length === 1) {
    const a = items[0]!;
    return (
      <div className="animate-portfolio-rise relative min-h-[280px] sm:min-h-[340px] lg:min-h-[440px]">
        <div className="absolute -inset-1 rounded-[1.5rem] bg-gradient-to-br from-white/60 via-transparent to-zinc-300/20 blur-sm" aria-hidden />
        <PortfolioCard
          src={a.src}
          alt={a.alt}
          unoptimized={a.unoptimized}
          index={0}
          variant="editorialHero"
          tier="hero"
          className="relative h-full"
          onClick={() => onOpenItem(a)}
        />
      </div>
    );
  }

  if (items.length === 2) {
    const [a, b] = items;
    return (
      <div className="group/duo relative grid min-h-[280px] grid-cols-2 gap-4 sm:min-h-[320px] sm:gap-5 lg:min-h-[440px] lg:gap-6">
        <div className="animate-portfolio-rise min-h-0 lg:translate-y-3">
          <PortfolioCard
            src={a!.src}
            alt={a!.alt}
            unoptimized={a!.unoptimized}
            index={0}
            variant="editorialSupporting"
            tier="accent"
            className="h-full min-h-[230px] lg:min-h-0"
            onClick={() => onOpenItem(a!)}
          />
        </div>
        <div className="animate-portfolio-rise min-h-0 lg:-translate-y-3" style={{ animationDelay: "75ms" }}>
          <PortfolioCard
            src={b!.src}
            alt={b!.alt}
            unoptimized={b!.unoptimized}
            index={1}
            variant="editorialSupporting"
            tier="accent"
            className="h-full min-h-[230px] lg:min-h-0"
            onClick={() => onOpenItem(b!)}
          />
        </div>
      </div>
    );
  }

  const [a, b, c] = [items[0]!, items[1]!, items[2]!];
  return (
    <div className="relative min-h-[300px] sm:min-h-[340px] lg:min-h-[460px]">
      <div
        className="pointer-events-none absolute left-[8%] top-1/2 hidden h-[78%] w-[55%] -translate-y-1/2 rounded-[1.5rem] bg-zinc-900/[0.04] blur-2xl lg:block"
        aria-hidden
      />
      <div className="relative grid grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        <div className="relative z-20 col-span-5 min-h-0 sm:col-span-3 lg:col-span-3">
          <div className="animate-portfolio-rise">
            <PortfolioCard
              src={a.src}
              alt={a.alt}
              unoptimized={a.unoptimized}
              index={0}
              variant="editorialHero"
              tier="hero"
              className="h-full min-h-[260px] lg:min-h-full"
              onClick={() => onOpenItem(a)}
            />
          </div>
        </div>
        <div className="group/side relative z-10 col-span-5 flex min-h-0 flex-col gap-3 sm:col-span-2 sm:gap-4 lg:col-span-2 lg:gap-5">
          <div
            className="min-h-0 flex-1 animate-portfolio-rise transition-transform duration-500 ease-out lg:origin-top-right lg:translate-x-1 lg:-translate-y-1 lg:rotate-[0.35deg] lg:group-hover/side:translate-x-0 lg:group-hover/side:translate-y-0 lg:group-hover/side:rotate-0"
            style={{ animationDelay: "65ms" }}
          >
            <PortfolioCard
              src={b.src}
              alt={b.alt}
              unoptimized={b.unoptimized}
              index={1}
              variant="editorialSupporting"
              tier="accent"
              className="h-full min-h-[140px] lg:min-h-0"
              onClick={() => onOpenItem(b)}
            />
          </div>
          <div
            className="min-h-0 flex-1 animate-portfolio-rise transition-transform duration-500 ease-out lg:origin-bottom-right lg:-translate-x-0.5 lg:translate-y-1 lg:-rotate-[0.25deg] lg:group-hover/side:translate-x-0 lg:group-hover/side:translate-y-0 lg:group-hover/side:rotate-0"
            style={{ animationDelay: "115ms" }}
          >
            <PortfolioCard
              src={c.src}
              alt={c.alt}
              unoptimized={c.unoptimized}
              index={2}
              variant="editorialSupporting"
              tier="accent"
              className="h-full min-h-[140px] lg:min-h-0"
              onClick={() => onOpenItem(c)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
