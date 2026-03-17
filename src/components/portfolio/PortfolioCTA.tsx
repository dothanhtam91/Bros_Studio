"use client";

import Link from "next/link";
import { IconArrowRight } from "@/components/home/icons";

export function PortfolioCTA() {
  return (
    <section className="relative border-t border-zinc-200/60 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(251,191,36,0.04), transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/70 px-6 py-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-sm sm:px-8 sm:py-12">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Add your project
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Schedule a shoot to add new work to your collection.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/12 px-5 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-500/20 hover:border-amber-400/60"
            >
              Book a shoot
              <IconArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/packages"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              View packages
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
