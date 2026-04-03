"use client";

import { useCallback, useEffect, useState } from "react";
import { Music } from "lucide-react";
import { SITE_AMBIENT_MUSIC } from "@/lib/siteAmbientMusic";

const { youtubeVideoId } = SITE_AMBIENT_MUSIC;

/** One iframe in the whole document — avoids double audio from React dev Strict Mode remounts / HMR. */
const IFRAME_ID = "bros-site-ambient-music-iframe";

function buildEmbedSrc(): string {
  const p = new URLSearchParams({
    autoplay: "1",
    loop: "1",
    playlist: youtubeVideoId,
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?${p.toString()}`;
}

export function SiteAmbientMusic() {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || typeof document === "undefined") return;

    document.getElementById(IFRAME_ID)?.remove();

    const iframe = document.createElement("iframe");
    iframe.id = IFRAME_ID;
    iframe.title = "Background music from YouTube";
    iframe.src = buildEmbedSrc();
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("aria-hidden", "true");
    iframe.className =
      "pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-[0.02]";
    document.body.appendChild(iframe);

    return () => {
      iframe.remove();
    };
  }, [playing]);

  const toggle = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Turn off background music" : "Turn on background music"}
      className={`fixed bottom-5 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_2px_16px_rgba(24,24,27,0.1)] backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 sm:bottom-6 sm:right-6 ${
        playing
          ? "border-amber-200/90 bg-white/95 text-amber-900 hover:bg-amber-50/90"
          : "border-zinc-200/90 bg-zinc-100/95 text-zinc-400 hover:border-zinc-300 hover:bg-white hover:text-zinc-600"
      }`}
    >
      <Music className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
