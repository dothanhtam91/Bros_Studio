"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

export type SocialCaptionImage = { id: string; image_url: string };

type Props = {
  open: boolean;
  onClose: () => void;
  selectedImages: SocialCaptionImage[];
  albumId: string;
  address?: string;
};

type CaptionResult = {
  caption: string;
  hashtags: string[];
  cta: string;
  fullText?: string;
};

type Language = "en" | "vi";

export function SocialCaptionModal({
  open,
  onClose,
  selectedImages,
  albumId,
  address = "",
}: Props) {
  const [language, setLanguage] = useState<Language>("en");
  const [trendingQuotes, setTrendingQuotes] = useState(false);
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [city, setCity] = useState("");
  const [highlights, setHighlights] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy caption");

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-social-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress: address || undefined,
          city: city || undefined,
          beds: beds || undefined,
          baths: baths || undefined,
          squareFootage: sqft || undefined,
          price: price || undefined,
          highlights: highlights || undefined,
          numPhotos: selectedImages.length,
          language,
          trendingQuotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to generate";
        if (res.status === 503 && typeof msg === "string" && msg.includes("GEMINI_API_KEY")) {
          throw new Error("API key not set. Add GEMINI_API_KEY to .env.local. Get a free key: aistudio.google.com/apikey");
        }
        if (res.status === 429 || (typeof msg === "string" && (msg.includes("quota") || msg.includes("Rate limit") || msg.includes("429")))) {
          throw new Error("RATE_LIMIT");
        }
        throw new Error(msg);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [address, city, beds, baths, sqft, price, highlights, selectedImages.length, language, trendingQuotes]);

  const handleCopy = useCallback(() => {
    const text = result?.fullText ?? [result?.caption, result?.cta, result?.hashtags?.join(" ")].filter(Boolean).join("\n\n");
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy caption"), 2000);
    });
  }, [result]);

  const openFacebook = () => {
    const shareUrl = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, "_blank", "noopener,noreferrer");
  };
  const openInstagram = () => window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  const downloadSelected = () => {
    if (selectedImages.length === 0) return;
    const ids = selectedImages.map((i) => i.id).join(",");
    window.open(`/api/delivery/albums/${albumId}/download?ids=${encodeURIComponent(ids)}`, "_blank");
  };

  useEffect(() => {
    if (!open) {
      setResult(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullCaption = result
    ? [result.caption, result.cta, result.hashtags?.length ? result.hashtags.join(" ") : ""].filter(Boolean).join("\n\n")
    : "";

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AI caption generator"
    >
      <div
        className="w-full max-w-lg flex flex-col max-h-[90vh] rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h3 className="text-lg font-semibold tracking-tight text-stone-900">
            AI Caption Generator
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Language */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">Language</p>
            <div className="flex rounded-xl border border-stone-200 p-1 bg-stone-50/50">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${language === "en" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${language === "vi" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
              >
                Tiếng Việt
              </button>
            </div>
          </div>

          {/* Trending quotes */}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/30 px-4 py-3">
            <span className="text-sm font-medium text-stone-700">Trending quotes style</span>
            <button
              type="button"
              role="switch"
              aria-checked={trendingQuotes}
              onClick={() => setTrendingQuotes((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${trendingQuotes ? "bg-amber-700/90" : "bg-stone-200"}`}
            >
              <span
                className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${trendingQuotes ? "left-5" : "left-0.5"}`}
              />
            </button>
          </div>

          {/* Thumbnails */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">
              Photos ({selectedImages.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selectedImages.slice(0, 20).map((img) => (
                <div key={img.id} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  <Image src={img.image_url} alt="" width={48} height={48} className="h-full w-full object-cover" unoptimized />
                </div>
              ))}
              {selectedImages.length > 20 && (
                <div className="flex h-12 shrink-0 items-center rounded-lg bg-stone-100 px-2.5 text-xs text-stone-500">
                  +{selectedImages.length - 20}
                </div>
              )}
            </div>
          </div>

          {/* Property fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Price</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$450,000" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Houston" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Beds</label>
              <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="4" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Baths</label>
              <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="3" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Sq ft</label>
              <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="2,400" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Highlights</label>
              <input type="text" value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="Pool, chef's kitchen" className={inputClass} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Generating…" : "Generate caption"}
          </button>

          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              {error === "RATE_LIMIT" ? (
                <>
                  <p className="font-medium">Rate limit reached.</p>
                  <p className="mt-1 text-amber-800">Wait a minute and try again.</p>
                  <a href="https://ai.dev/rate-limit" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-medium text-amber-700 underline hover:text-amber-900">
                    Check usage →
                  </a>
                </>
              ) : (
                <p>{error}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-2">Caption</label>
            <textarea
              readOnly
              value={fullCaption}
              placeholder="Caption will appear here."
              rows={5}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-1 focus:ring-stone-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-amber-100/80 bg-amber-50/30 px-6 py-4 rounded-b-2xl">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result}
            className="rounded-xl border border-amber-200/80 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-amber-50/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copyLabel}
          </button>
          <button type="button" onClick={openFacebook} className="rounded-xl border border-amber-200/80 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-amber-50/80 transition">
            Facebook
          </button>
          <button type="button" onClick={openInstagram} className="rounded-xl border border-amber-200/80 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-amber-50/80 transition">
            Instagram
          </button>
          <button type="button" onClick={downloadSelected} className="rounded-xl border border-amber-200/80 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-amber-50/80 transition">
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
