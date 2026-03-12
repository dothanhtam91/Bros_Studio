"use client";

import Link from "next/link";
import { IconClock, IconImage, IconLayers, IconSparkles } from "./icons";

const valueProps = [
  {
    title: "Next-Day Delivery",
    subtitle: "24–48 hour turnaround",
    description: "Fast turnaround so you can list your Houston property sooner.",
    icon: IconClock,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "High Quality Media",
    subtitle: "MLS-Ready Photos & Videos",
    description: "Professional real estate photos and videos that attract buyers.",
    icon: IconImage,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Friendly Service",
    subtitle: "Clear updates & support",
    description: "Reliable team with clear updates and personal support.",
    icon: IconLayers,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Full Spectrum",
    subtitle: "All-In-One Listing Media",
    description: "Complete real estate media solutions, from photos to delivery.",
    icon: IconSparkles,
    color: "from-violet-500 to-purple-600",
  },
];

export function ValueProps() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Why Houston Realtors Choose BrosStudio
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map(({ title, subtitle, description, icon: Icon, color }, i) => (
            <div
              key={title}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg animate-fade-in-up opacity-0"
              style={{ animationDelay: `${0.1 * (i + 1)}s` }}
            >
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition group-hover:scale-110`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
              <p className="mt-1 text-sm font-semibold text-zinc-600">{subtitle}</p>
              <p className="mt-3 text-sm text-zinc-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link
            href="/book"
            className="group inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/90 px-6 py-3 text-sm font-semibold text-stone-800 shadow-lg transition hover:bg-amber-100/90 hover:shadow-xl active:scale-100"
          >
            Book a shoot
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
