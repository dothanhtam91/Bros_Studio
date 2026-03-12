import type { Metadata } from "next";
import Link from "next/link";
import { PACKAGES, ADDONS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Packages & Pricing | BrosStudio",
  description: "Basic, Standard, and Luxury photography packages. Add-ons: twilight, drone, reels, rush delivery.",
};

const FAQ = [
  {
    q: "What’s your turnaround time?",
    a: "Standard delivery is 24–48 hours. Rush delivery add-on gets you 24h.",
  },
  {
    q: "Can I reschedule?",
    a: "Yes. Reschedule at least 24 hours before your shoot at no charge.",
  },
  {
    q: "What if it rains?",
    a: "We reschedule exterior shoots. Interior shoots can proceed; we’ll coordinate with you.",
  },
];

export default function PackagesPage() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Packages & add-ons
        </h1>
        <p className="mt-2 text-zinc-600">
          Simple tiers. Add what you need.
        </p>

        {/* Tier cards */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-zinc-900">{pkg.name}</h2>
              <p className="mt-1 text-zinc-600">{pkg.description}</p>
              <p className="mt-4 text-2xl font-semibold text-zinc-900">
                ${(pkg.price_cents / 100).toLocaleString()}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                {pkg.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Link
                href={`/book?package=${pkg.id}`}
                className="mt-6 block w-full rounded-xl bg-amber-50 border border-amber-200/90 py-2.5 text-center text-sm font-medium text-stone-800 hover:bg-amber-100/90"
              >
                Select
              </Link>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-zinc-900">Add-ons</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADDONS.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"
              >
                <div>
                  <p className="font-medium text-zinc-900">{addon.name}</p>
                  <p className="text-sm text-zinc-600">{addon.description}</p>
                </div>
                <p className="text-sm font-semibold text-zinc-900">
                  +${(addon.price_cents / 100).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-zinc-900">FAQ</h2>
          <dl className="mt-4 space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <dt className="font-medium text-zinc-900">{q}</dt>
                <dd className="mt-1 text-zinc-600">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-12 text-center">
          <Link
            href="/book"
            className="inline-flex rounded-xl bg-amber-50 border border-amber-200/90 px-6 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
          >
            Book a shoot
          </Link>
        </div>
      </div>
    </main>
  );
}
