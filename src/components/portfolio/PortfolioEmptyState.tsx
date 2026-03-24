"use client";

import Image from "next/image";
import Link from "next/link";

type Suggestion = {
  src: string;
  alt: string;
  category?: string;
  unoptimized: boolean;
};

export function PortfolioEmptyState({
  category,
  suggestions,
  onSuggestionClick,
}: {
  category: string | null;
  suggestions: Suggestion[];
  onSuggestionClick?: (index: number) => void;
}) {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200/50">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            {category
              ? `${category.charAt(0).toUpperCase() + category.slice(1)} shots coming soon`
              : "Gallery is being curated"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Fresh work is regularly added. Browse another collection or view all our work.
          </p>
          <Link
            href="/portfolio"
            className="mt-5 inline-block rounded-xl border border-amber-200/90 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-amber-100/90"
          >
            View all work
          </Link>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-12">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              From other collections
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {suggestions.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => onSuggestionClick?.(i)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-200 ring-1 ring-zinc-200/60 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, 16vw"
                    unoptimized={img.unoptimized}
                  />
                  {img.category && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium capitalize text-stone-700 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                      {img.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
