"use client";

export function PortfolioEmptyShowcase() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          No images in this category yet
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Try another category or check back soon.
        </p>
      </div>
    </section>
  );
}
