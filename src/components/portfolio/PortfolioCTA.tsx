"use client";

import Link from "next/link";

export function PortfolioCTA() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-[88rem] xl:max-w-[92rem]">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white px-6 py-12 shadow-sm sm:px-12 sm:py-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-100/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-50/50 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-lg text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-600/80">
              Next project
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              When you are ready to shoot
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
              Book a session or browse packages. We keep the process simple so you can focus on the listing.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/20"
              >
                Book a shoot
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/packages"
                className="rounded-xl border border-zinc-200/80 bg-white px-7 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              >
                View packages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
