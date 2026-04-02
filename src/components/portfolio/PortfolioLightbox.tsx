"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { formatCategoryLabel, formatPortfolioItemTitle } from "@/lib/portfolioDisplayLabel";

type Item = {
  src: string;
  alt: string;
  category?: string;
  title?: string;
  unoptimized: boolean;
};

function LightboxSlide({
  item,
  caption,
  index,
  total,
}: {
  item: Item;
  caption: string;
  index: number;
  total: number;
}) {
  const [imageReady, setImageReady] = useState(false);

  return (
    <div
      className="flex max-h-[90vh] max-w-6xl flex-col items-center px-4 sm:px-8"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative max-h-[75vh] w-full min-w-0">
        {!imageReady && (
          <div
            className="image-loading-shimmer absolute inset-0 min-h-[38vh] rounded-xl sm:min-h-[45vh]"
            aria-hidden
          />
        )}
        <Image
          src={item.src}
          alt={item.alt}
          width={1920}
          height={1280}
          className={`mx-auto h-auto max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl transition-opacity duration-500 ${
            imageReady ? "opacity-100" : "opacity-0"
          }`}
          sizes="95vw"
          priority
          unoptimized={item.unoptimized}
          onLoad={() => setImageReady(true)}
          onError={() => setImageReady(true)}
        />
      </div>

      <div className="mt-6 flex max-w-md flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium tracking-tight text-white/95">{caption}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {item.category && (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
              {formatCategoryLabel(item.category)}
            </span>
          )}
          <span className="text-[11px] tabular-nums text-white/45">
            {index + 1} / {total}
          </span>
        </div>
      </div>
    </div>
  );
}

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
    setIndex(startIndex);
  }, [startIndex]);

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

  const caption = formatPortfolioItemTitle(item.alt, item.title, item.category, index);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F1115]/95 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        aria-label="Close"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 transition hover:border-white/20 hover:bg-white/10 sm:left-5"
            aria-label="Previous image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 transition hover:border-white/20 hover:bg-white/10 sm:right-5"
            aria-label="Next image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <LightboxSlide
        key={item.src}
        item={item}
        caption={caption}
        index={index}
        total={items.length}
      />
    </div>
  );
}
