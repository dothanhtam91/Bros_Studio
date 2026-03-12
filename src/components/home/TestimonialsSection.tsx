"use client";

const testimonials = [
  {
    quote: "Amazing photographer! Did aerial pictures on one of my listings and they turned out great! Would recommend to anybody who needs a photographer!",
    name: "Brooke Houston",
    company: "Texas Real Estate Pro",
    stars: 5,
  },
  {
    quote: "Great communication, easy booking process, on time for appointment and prompt media delivery. Always professional with excellent work. Media looks great for my client's listings! Highly recommend.",
    name: "Cellina Stokes",
    company: "Crowne Realty",
    stars: 5,
  },
  {
    quote: "Did an amazing job from not only the photography of my new listing but helping me stage and move things around to be sure we had the best photo. Went above and beyond. The turn around time is unmatched.",
    name: "Jeanette Zirlott",
    company: "Real Broker, LLC",
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 text-amber-500" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-lg">★</span>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          What Realtors Say About Us
        </h2>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map(({ quote, name, company, stars }) => (
            <div
              key={name}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm"
            >
              <StarRating count={stars} />
              <p className="mt-4 flex-1 text-zinc-700">&ldquo;{quote}&rdquo;</p>
              <p className="mt-4 font-semibold text-zinc-900">{name}</p>
              <p className="text-sm text-zinc-500">{company}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
