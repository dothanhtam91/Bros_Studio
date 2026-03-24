"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Item = {
  src: string;
  alt: string;
  category?: string;
  unoptimized: boolean;
};

export function PortfolioLightbox({
  items,
  startIndex,
  onClose,
}: {
  items: Item[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const item = items[index];

  const prev = useCallback(
    () => setIndex((i) => (i > 0 ? i - 1 : items.length - 1)),
    [items.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i < items.length - 1 ? i + 1 : 0)),
    [items.length]
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
        aria-label="Close"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white sm:left-5"
            aria-label="Previous image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white sm:right-5"
            aria-label="Next image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <div
        className="relative mx-4 max-h-[85vh] max-w-5xl overflow-hidden sm:mx-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={item.src}
          src={item.src}
          alt={item.alt}
          width={1600}
          height={1200}
          className="h-auto max-h-[85vh] w-auto rounded-lg object-contain"
          sizes="90vw"
          priority
          unoptimized={item.unoptimized}
        />
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        {item.category && (
          <span className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium capitalize text-white/80 backdrop-blur-sm">
            {item.category}
          </span>
        )}
        <span className="text-xs tabular-nums text-white/50">
          {index + 1} / {items.length}
        </span>
      </div>
    </div>
  );
}
