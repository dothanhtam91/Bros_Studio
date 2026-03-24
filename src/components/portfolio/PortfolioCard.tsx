"use client";

import Image from "next/image";

export type CardSpan = "large" | "medium" | "small";

const spanClasses: Record<CardSpan, string> = {
  large: "sm:col-span-2 sm:row-span-2",
  medium: "sm:col-span-1 sm:row-span-2",
  small: "sm:col-span-1 sm:row-span-1",
};

const aspectClasses: Record<CardSpan, string> = {
  large: "aspect-[4/3] sm:aspect-[16/10]",
  medium: "aspect-[3/4]",
  small: "aspect-[4/3]",
};

function spanForIndex(i: number, total: number): CardSpan {
  if (total <= 2) return "large";
  if (i === 0) return "large";
  if (i === 3 || i === 7) return "medium";
  return "small";
}

export { spanForIndex };

export function PortfolioCard({
  src,
  alt,
  category,
  span,
  unoptimized,
  index,
  onClick,
}: {
  src: string;
  alt: string;
  category?: string;
  span: CardSpan;
  unoptimized: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-zinc-200/90 ring-1 ring-zinc-200/60 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:ring-zinc-300/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${spanClasses[span]}`}
      style={{
        animationDelay: `${Math.min(index * 50, 350)}ms`,
      }}
      aria-label={alt}
    >
      <div className={`relative w-full ${aspectClasses[span]}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          sizes={
            span === "large"
              ? "(max-width: 640px) 100vw, 50vw"
              : span === "medium"
                ? "(max-width: 640px) 100vw, 25vw"
                : "(max-width: 640px) 100vw, 25vw"
          }
          loading={index < 4 ? "eager" : "lazy"}
          unoptimized={unoptimized}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {category && (
          <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-medium capitalize tracking-wide text-stone-700 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
            {category}
          </span>
        )}
      </div>
    </button>
  );
}
