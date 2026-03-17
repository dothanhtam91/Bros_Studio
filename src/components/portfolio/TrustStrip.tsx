export function TrustStrip() {
  const items = [
    "Trusted by Houston Realtors",
    "MLS-ready delivery",
    "Fast turnaround",
    "Luxury & residential experience",
  ];

  return (
    <section className="border-y border-zinc-200/80 bg-zinc-50/60 py-4" aria-hidden>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-center text-xs font-medium tracking-wider text-zinc-500 sm:gap-x-10 sm:px-6">
        {items.map((label, i) => (
          <span key={label} className="flex items-center gap-x-8">
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
