"use client";

import Image from "next/image";

type HeroImage = { src: string; alt: string; unoptimized: boolean };

export function PortfolioHero({ featured }: { featured: HeroImage[] }) {
  const imgs = featured.slice(0, 5);

  return (
    <section className="px-4 pt-24 pb-2 sm:px-6 sm:pt-28 sm:pb-4 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-12">
        <div className="animate-fade-in-up">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Portfolio
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Selected Work
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-600">
            Cinematic real-estate imagery designed to make listings stand out —
            drone aerials, interiors, exteriors, twilight, and detail frames
            delivered with premium polish.
          </p>
        </div>

        {imgs.length > 0 && (
          <div
            className="hidden animate-fade-in-up lg:grid lg:grid-cols-6 lg:grid-rows-2 lg:gap-2.5"
            style={{ animationDelay: "120ms" }}
            aria-hidden
          >
            {imgs[0] && (
              <div className="col-span-4 row-span-2 overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-200/70">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={imgs[0].src}
                    alt={imgs[0].alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 0px, 40vw"
                    priority
                    unoptimized={imgs[0].unoptimized}
                  />
                </div>
              </div>
            )}
            {imgs[1] && (
              <div className="col-span-2 overflow-hidden rounded-xl bg-zinc-200 ring-1 ring-zinc-200/70">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={imgs[1].src}
                    alt={imgs[1].alt}
                    fill
                    className="object-cover"
                    sizes="20vw"
                    priority
                    unoptimized={imgs[1].unoptimized}
                  />
                </div>
              </div>
            )}
            {imgs[2] && (
              <div className="col-span-2 overflow-hidden rounded-xl bg-zinc-200 ring-1 ring-zinc-200/70">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={imgs[2].src}
                    alt={imgs[2].alt}
                    fill
                    className="object-cover"
                    sizes="20vw"
                    unoptimized={imgs[2].unoptimized}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {imgs.length > 0 && (
          <div className="flex gap-2 overflow-hidden rounded-2xl lg:hidden" aria-hidden>
            {imgs.slice(0, 3).map((img, i) => (
              <div key={i} className="relative aspect-[3/4] flex-1 overflow-hidden rounded-xl bg-zinc-200 ring-1 ring-zinc-200/70">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="33vw"
                  priority={i === 0}
                  unoptimized={img.unoptimized}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
