"use client";

export function StatsStrip() {
  const stats = [
    { value: "5,000+", label: "Homes captured" },
    { value: "1,000+", label: "Realtors served" },
  ];

  return (
    <section className="border-y border-zinc-200 bg-zinc-900 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:flex md:justify-center md:gap-24">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {value}
              </p>
              <p className="mt-1 text-sm font-medium uppercase tracking-wider text-zinc-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
