"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { SocialCaptionModal } from "@/components/delivery/SocialCaptionModal";

export type AlbumImage = { id: string; image_url: string; sort_order: number };

const btnBase = "inline-flex items-center gap-2 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2";
const btnPrimary = `${btnBase} bg-amber-50 border border-amber-200/90 px-5 py-2.5 text-stone-800 hover:bg-amber-100/90`;
const btnSecondary = `${btnBase} border border-amber-200/80 bg-white px-5 py-2.5 text-stone-700 hover:bg-amber-50/80`;
const btnGhost = `${btnBase} text-stone-600 hover:bg-amber-50/80 hover:text-stone-800 px-4 py-2.5`;

function RevealOnScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "40px 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
      }}
    >
      {children}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

type Props = {
  albumId: string;
  images: AlbumImage[];
  address?: string;
  hideAiCaption?: boolean;
};

export function AlbumGalleryClient({ albumId, images, address, hideAiCaption }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const imagesForSocial = selectedIds.size > 0 ? images.filter((img) => selectedIds.has(img.id)) : images;
  const selectedForSocial = imagesForSocial.map(({ id, image_url }) => ({ id, image_url }));

  const openLightbox = (index: number) => {
    if (!selectMode) setLightboxIndex(index);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, goPrev, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 50) delta > 0 ? goPrev() : goNext();
    setTouchStart(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadAll = () => window.open(`/api/delivery/albums/${albumId}/download`, "_blank");
  const downloadSelected = () => {
    if (selectedIds.size === 0) return;
    window.open(`/api/delivery/albums/${albumId}/download?ids=${encodeURIComponent(Array.from(selectedIds).join(","))}`, "_blank");
  };
  const downloadCurrentImage = () => {
    if (lightboxIndex === null) return;
    window.open(images[lightboxIndex].image_url, "_blank", "noopener");
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

  if (!images.length) return null;

  return (
    <>
      {/* Toolbar — clear hierarchy */}
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <button type="button" onClick={downloadAll} className={btnPrimary}>
          <DownloadIcon />
          Download all
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectMode((m) => !m);
            if (!selectMode) setSelectedIds(new Set());
          }}
          className={selectMode ? btnPrimary : btnSecondary}
        >
          <CheckIcon />
          {selectMode ? "Cancel" : "Select"}
        </button>
        {selectMode && selectedIds.size > 0 && (
          <button type="button" onClick={downloadSelected} className={btnSecondary}>
            <DownloadIcon />
            Download ({selectedIds.size})
          </button>
        )}
        <button type="button" onClick={copyShareLink} className={btnSecondary}>
          <LinkIcon />
          {shareCopied ? "Copied" : "Share link"}
        </button>
        <div className="flex-1" />
        <button type="button" onClick={() => setSelectedIds(new Set())} className={btnGhost}>
          Full album
        </button>
        {!hideAiCaption && (
          <button type="button" onClick={() => setSocialModalOpen(true)} className={btnGhost}>
            <SparklesIcon />
            AI caption
          </button>
        )}
      </div>

      {/* Gallery grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, index) => (
          <RevealOnScroll key={img.id}>
            <div
              className={`group relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200 shadow-md ring-1 ring-stone-200/60 transition-[transform] duration-300 ease hover:scale-[1.02] ${!selectMode ? "cursor-pointer" : ""}`}
              onClick={() => (selectMode ? toggleSelect(img.id) : openLightbox(index))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                selectMode ? toggleSelect(img.id) : openLightbox(index);
              }}
            >
              <Image
                src={img.image_url}
                alt=""
                width={800}
                height={600}
                className="h-full w-full object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
              {selectMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${selectedIds.has(img.id) ? "border-white bg-white text-stone-900" : "border-white text-white"}`}
                  >
                    {selectedIds.has(img.id) ? "✓" : ""}
                  </div>
                </div>
              )}
            </div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-lg p-3 text-white/80 hover:bg-white/10 hover:text-white transition"
            aria-label="Previous"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[lightboxIndex].image_url}
              alt=""
              width={1600}
              height={1200}
              className="max-h-[90vh] w-auto object-contain"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-lg p-3 text-white/80 hover:bg-white/10 hover:text-white transition"
            aria-label="Next"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
            {lightboxIndex + 1} / {images.length}
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); downloadCurrentImage(); }}
            className="absolute bottom-4 right-4 rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100 transition"
          >
            Download
          </button>
        </div>
      )}

      {!hideAiCaption && (
        <SocialCaptionModal
          open={socialModalOpen}
          onClose={() => setSocialModalOpen(false)}
          selectedImages={selectedForSocial}
          albumId={albumId}
          address={address}
        />
      )}
    </>
  );
}
