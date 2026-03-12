import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | BrosStudio",
  description: "AI and software engineer + broker team. Luxury real estate photography.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          About BrosStudio
        </h1>
        <div className="mt-8 space-y-6 text-zinc-600">
          <p>
            BrosStudio is built by an AI/software engineer and broker team assistant who understand both sides: what agents need to list fast and what buyers expect from luxury listings.
          </p>
          <p>
            We deliver MLS-ready photos and video through a branded portal—no messy Drive links, no back-and-forth. You get consistent quality, clear delivery notes, and optional add-ons like twilight, drone, and reels when you need them.
          </p>
          <p>
            Trusted by Houston agents for speed, consistency, and a professional experience from shoot to delivery.
          </p>
        </div>
        <div className="mt-12">
          <a
            href="/contact"
            className="inline-flex rounded-xl bg-amber-50 border border-amber-200/90 px-6 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
          >
            Get in touch
          </a>
        </div>
      </div>
    </main>
  );
}
