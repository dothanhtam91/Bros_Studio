"use client";

import Link from "next/link";

const CAPTURE_TYPES = [
  {
    id: "photography",
    title: "Photography",
    description: "Interiors, exteriors, and detail frames.",
  },
  {
    id: "video",
    title: "Video",
    description: "Walkthrough and vertical formats.",
  },
  {
    id: "drone",
    title: "Drone",
    description: "Aerial stills and scale.",
  },
  {
    id: "twilight",
    title: "Twilight",
    description: "Dusk and night exteriors.",
  },
  {
    id: "branding",
    title: "Branding",
    description: "Agent and brokerage visuals.",
  },
] as const;

export function ServiceTypePanels() {
  return (
    <section
      className="relative border-t border-zinc-200/60 bg-white/40 px-4 py-12 backdrop-blur-[2px] sm:px-6 sm:py-14 lg:px-8"
      aria-label="Filter by media type"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          View by capture type
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          Media categories
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          {CAPTURE_TYPES.map((s) => (
            <Link
              key={s.id}
              href={`/portfolio?type=${s.id}`}
              className="group rounded-xl border border-zinc-200/80 bg-white/80 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)] backdrop-blur-sm transition hover:border-amber-300/50 hover:bg-amber-50/20"
            >
              <h3 className="font-semibold tracking-tight text-zinc-900 group-hover:text-amber-900">
                {s.title}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-600">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
