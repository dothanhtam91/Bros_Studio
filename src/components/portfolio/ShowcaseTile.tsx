"use client";

import Image from "next/image";

type Size = "featured" | "medium" | "small";

export function ShowcaseTile({
  src,
  alt,
  size = "medium",
  unoptimized = false,
}: {
  src: string;
  alt: string;
  size?: Size;
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
      className={`group relative overflow-hidden bg-zinc-200/90 ring-1 ring-zinc-200/70 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:ring-zinc-300 ${sizeClasses[size]}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
        sizes={
          size === "featured"
            ? "(max-width: 640px) 100vw, 66vw"
            : size === "medium"
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        }
        unoptimized={unoptimized}
      />
    </div>
  );
}
