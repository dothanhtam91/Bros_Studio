"use client";

export function TrustRow() {
  return (
    <section className="border-y border-zinc-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-xl font-bold text-zinc-900 sm:text-2xl">
          Trusted by Houston&apos;s Greatest Real Estate Agents
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 opacity-70">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-12 w-24 rounded-lg bg-zinc-200/80 transition hover:opacity-100"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}
