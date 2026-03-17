import type { Metadata } from "next";
import Link from "next/link";
import { PACKAGE_TIERS, type PackageTier } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Packages & Pricing | BrosStudio",
  description: "Real estate photography packages by square footage. From under 1,000 sqft to 3,000+ sqft.",
};

const FAQ = [
  {
    q: "What's your turnaround time?",
    a: "Standard delivery is 24–48 hours. Rush delivery add-on available.",
  },
  {
    q: "Can I reschedule?",
    a: "Yes. Reschedule at least 24 hours before your shoot at no charge.",
  },
  {
    q: "What if it rains?",
    a: "We reschedule exterior shoots. Interior shoots can proceed; we'll coordinate with you.",
  },
  {
    q: "Travel fees?",
    a: "Properties within 20 miles of Katy, TX 77449 have no travel fee. Beyond 20 miles, $1.80 per mile applies.",
  },
];

const INCLUDED_FEATURES = ["HDR Photos", "MLS Ready", "Fast Delivery"];

function formatPrice(cents: number, withPlus = false) {
  const s = `$${(cents / 100).toLocaleString()}`;
  return withPlus ? `${s}+` : s;
}

function PriceCard({ tier }: { tier: PackageTier }) {
  const hasBadge = !!tier.badge;
  return (
    <div
      className={`relative rounded-2xl border bg-white transition duration-200 hover:shadow-lg active:scale-[0.99] ${
        hasBadge
          ? "border-amber-200/80 shadow-md shadow-amber-500/5"
          : "border-zinc-200/90 shadow-sm hover:border-zinc-300"
      }`}
    >
      {hasBadge && (
        <div className="absolute -top-2 left-4">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              tier.badge === "Most popular"
                ? "bg-amber-100 text-amber-800"
                : tier.badge === "Best value"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {tier.badge}
          </span>
        </div>
      )}
      <div className={`p-4 sm:p-5 ${hasBadge ? "pt-5 sm:pt-6" : ""}`}>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          Package {tier.id}
        </h2>
        {tier.description && (
          <p className="mt-0.5 text-xs text-zinc-500">{tier.description}</p>
        )}
        <p className="mt-1.5 text-xs text-zinc-500">
          {tier.sqftMax != null
            ? `${tier.sqftMin.toLocaleString()}–${tier.sqftMax.toLocaleString()} sqft`
            : `${tier.sqftMin.toLocaleString()}+ sqft`}
          <span className="text-zinc-400"> · </span>
          {tier.photoRange}
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
          {formatPrice(tier.priceCents, tier.priceIsFrom)}
        </p>
        {tier.extraPhotoRule && (
          <p className="mt-0.5 text-xs text-zinc-500">{tier.extraPhotoRule}</p>
        )}
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          {INCLUDED_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-1">
              <span className="text-amber-600" aria-hidden>✓</span>
              {f}
            </li>
          ))}
        </ul>
        <Link
          href={`/book?package=${tier.id}`}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-amber-200/90 bg-amber-50 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 hover:border-amber-300/90 active:bg-amber-200/90"
        >
          Select
        </Link>
      </div>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Packages & pricing
        </h1>
        <p className="mt-2 text-zinc-600">
          Simple tiers by square footage. More space, more photos, transparent pricing.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-5">
          {PACKAGE_TIERS.map((tier) => (
            <PriceCard key={tier.id} tier={tier} />
          ))}
        </div>

        <section className="mt-14">
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

        <div className="mt-10 text-center">
          <Link
            href="/book"
            className="inline-flex rounded-xl border border-amber-200/90 bg-amber-50 px-6 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
          >
            Book now
          </Link>
        </div>
      </div>
    </main>
  );
}
