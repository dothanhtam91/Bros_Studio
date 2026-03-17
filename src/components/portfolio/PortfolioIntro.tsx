"use client";

export function PortfolioIntro() {
  return (
    <section className="relative overflow-hidden px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-12 lg:px-8">
      {/* Gallery-style background — soft grid, warm wash, radial light */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #fafaf9 0%, #f6f6f5 40%, #f2f2f1 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.6]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 60% 20%, rgba(251,191,36,0.04), transparent 50%), radial-gradient(ellipse 50% 30% at 20% 70%, rgba(0,0,0,0.02), transparent 45%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-12">
        {/* Left: intro content */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700/80">
            Curated Collection
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Portfolio
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
            A selection of interiors, exteriors, detail frames, and cinematic
            property visuals across different listing styles.
          </p>
          <p className="mt-6 text-xs font-medium tracking-widest text-zinc-500">
            Interiors · Exteriors · Twilight · Aerial
          </p>
        </div>

        {/* Right: atmospheric visual composition — no copy */}
        <div className="relative hidden lg:block" aria-hidden>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-zinc-200/80 to-zinc-100/60 shadow-inner" />
            <div className="col-span-1 row-span-2 self-center">
              <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-amber-100/40 to-stone-200/50 shadow-inner" />
            </div>
            <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-zinc-100/70 to-zinc-200/50 shadow-inner" />
          </div>
          <div
            className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-200/20 blur-2xl"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
