import Link from "next/link";

export function AboutSection() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Why Choose BrosStudio
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Serving the best Houston Realtors
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600">
          BrosStudio is built to help agents stand out and sell homes faster. We combine professional real estate photography with a branded delivery portal—no messy Drive links, no back-and-forth. Every client gets MLS-ready media, clear delivery notes, and optional add-ons like twilight, drone, and reels. Our mission is to go above and beyond for every client, every listing, every time.
        </p>
        <Link
          href="/about"
          className="mt-8 inline-block font-semibold text-zinc-900 underline decoration-zinc-400 underline-offset-4 hover:text-zinc-700"
        >
          About the team
        </Link>
      </div>
    </section>
  );
}
