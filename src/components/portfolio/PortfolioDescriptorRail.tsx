"use client";

export function PortfolioDescriptorRail() {
  const items = [
    "Browse by property style",
    "Curated categories",
    "Updated project selection",
    "Visual archive",
  ];

  return (
    <section
      className="relative border-t border-zinc-200/70 bg-white/40 py-3.5 backdrop-blur-[2px]"
      aria-label="Collection navigation"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 text-center text-xs font-medium tracking-wider text-zinc-500 sm:gap-x-8 sm:px-6">
        {items.map((label, i) => (
          <span key={label} className="flex items-center gap-x-6">
            {i > 0 && (
              <span className="hidden text-zinc-300 sm:inline" aria-hidden>
                ·
              </span>
            )}
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
