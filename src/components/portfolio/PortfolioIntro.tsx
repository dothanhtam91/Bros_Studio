"use client";

export function PortfolioIntro() {
  return (
    <section className="px-4 pb-6 pt-24 sm:px-6 sm:pb-8 sm:pt-28 lg:px-8">
      <div className="mx-auto max-w-6xl animate-fade-in-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
          Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Selected Work
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          Drone, interior, exterior, twilight, and detail-focused imagery crafted for premium listing presentation.
        </p>
      </div>
    </section>
  );
}
