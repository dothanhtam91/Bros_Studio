"use client";

import Link from "next/link";
import { IconImage, IconCamera, IconSparkles } from "./icons";

const services = [
  {
    title: "Photos",
    href: "/portfolio",
    description: "MLS-ready listing photography.",
    icon: IconImage,
  },
  {
    title: "Listing videos",
    href: "/portfolio",
    description: "Walkthrough and reels.",
    icon: IconCamera,
  },
  {
    title: "Drone",
    href: "/packages",
    description: "Aerial photos & video.",
    icon: IconSparkles,
  },
  {
    title: "& More",
    href: "/packages",
    description: "Twilight, staging, add-ons.",
    icon: IconSparkles,
  },
];

export function ServicesGrid() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
          One-stop shop
        </p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Listing Media
        </h2>
        <div className="mt-4 flex justify-center">
          <Link
            href="/packages"
            className="text-sm font-medium text-zinc-600 underline decoration-zinc-400 underline-offset-4 hover:text-zinc-900"
          >
            View all services
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ title, href, description, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/90 text-amber-800 transition group-hover:bg-amber-100/90">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{description}</p>
              <span className="mt-4 text-sm font-medium text-zinc-600 group-hover:text-zinc-900">
                View more…
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/book"
            className="inline-flex rounded-xl bg-amber-50 border border-amber-200/90 px-8 py-3 text-sm font-semibold text-stone-800 transition hover:bg-amber-100/90"
          >
            Book a shoot
          </Link>
        </div>
      </div>
    </section>
  );
}
