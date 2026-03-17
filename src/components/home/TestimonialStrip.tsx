"use client";

const QUOTES = [
  {
    text: "I’m not saying BrosStudio sold the listing, but the photos definitely stopped it from being ignored.",
    name: "T.D. Realtor®",
    company: "Keller Williams Signature",
  },
  {
    text: "Great communication, easy booking, on time, prompt delivery. Always professional with excellent work. Highly recommend.",
    name: "Cellina Stokes",
    company: "Crowne Realty",
  },
  {
    text: "Went above and beyond—staging help and unmatched turn around time.",
    name: "Jeanette Zirlott",
    company: "Real Broker, LLC",
  },
];

export function TestimonialStrip() {
  return (
    <section className="relative border-y border-zinc-200/80 bg-zinc-50/60 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
          What Realtors Say
        </p>
        <blockquote className="mt-3 text-center text-lg font-medium leading-snug text-zinc-800 sm:text-xl">
          &ldquo;{QUOTES[0].text}&rdquo;
        </blockquote>
        <footer className="mt-2 text-center text-sm text-zinc-500">
          — {QUOTES[0].name}, {QUOTES[0].company}
        </footer>
      </div>
    </section>
  );
}
