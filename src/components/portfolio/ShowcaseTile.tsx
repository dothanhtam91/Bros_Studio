"use client";

import Image from "next/image";

type Size = "featured" | "medium" | "small";

export function ShowcaseTile({
  src,
  alt,
  size = "medium",
  category,
  title,
  serviceType,
  unoptimized = false,
}: {
  src: string;
  alt: string;
  size?: Size;
  category?: string;
  title?: string;
  serviceType?: string;
  unoptimized?: boolean;
}) {
  const sizeClasses = {
    featured:
      "aspect-[16/10] sm:aspect-[2/1] rounded-2xl sm:rounded-3xl col-span-full sm:col-span-2",
    medium:
      "aspect-[4/3] rounded-2xl sm:col-span-1",
    small:
      "aspect-[4/3] rounded-xl sm:rounded-2xl sm:col-span-1",
  };

  return (
    <div
      className={`group relative overflow-hidden bg-zinc-200/90 ring-1 ring-zinc-200/60 transition-shadow duration-300 hover:ring-zinc-300/70 ${sizeClasses[size]}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
        sizes={
          size === "featured"
            ? "(max-width: 640px) 100vw, 66vw"
            : size === "medium"
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        }
        unoptimized={unoptimized}
      />
      {/* Bottom overlay — editorial label on hover */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent pt-12 pb-3 px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        {category && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
            {category}
          </span>
        )}
        {title && (
          <p className="mt-0.5 text-sm font-medium text-white/95">{title}</p>
        )}
        {serviceType && (
          <p className="mt-0.5 text-xs text-white/75">{serviceType}</p>
        )}
      </div>
    </div>
  );
}
