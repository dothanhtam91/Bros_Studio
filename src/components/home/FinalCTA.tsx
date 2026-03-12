import Link from "next/link";
import { IconArrowRight } from "./icons";

export function FinalCTA() {
  return (
    <section className="border-t border-zinc-200 bg-zinc-900 py-20 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Why Choose BrosStudio
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Are You Ready?
        </h2>
        <ul className="mt-8 space-y-3 text-left text-zinc-300 sm:mx-auto sm:max-w-md sm:text-center">
          <li className="flex items-center gap-2">
            <span className="text-emerald-400">•</span>
            Next-day delivery so you can launch listings faster
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400">•</span>
            Professional photography, video, drone, and more under one roof
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400">•</span>
            Friendly team that communicates clearly and shows up on time
          </li>
        </ul>
        <Link
          href="/book"
          className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/90 px-8 py-4 text-base font-semibold text-stone-800 shadow-xl transition hover:scale-105 hover:bg-amber-100/90 hover:shadow-2xl active:scale-100"
        >
          Book a shoot
          <IconArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
