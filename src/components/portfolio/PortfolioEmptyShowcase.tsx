"use client";

export function PortfolioEmptyShowcase() {
  return (
    <section className="relative border-t border-zinc-200/60 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Visual archive
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Selection in preparation
        </h2>
        <p className="mt-4 text-zinc-600 leading-relaxed text-sm">
          New frames and project work will appear here as they are added to the
          collection.
        </p>
      </div>

      {/* Placeholder frames — same language as intro right-side panels */}
      <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-xl bg-gradient-to-br from-zinc-200/80 to-zinc-100/60 shadow-inner ring-1 ring-zinc-200/50 sm:rounded-2xl"
            aria-hidden
          >
            <div className="flex h-full items-center justify-center">
              <span className="text-[10px] font-medium text-zinc-400">—</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
