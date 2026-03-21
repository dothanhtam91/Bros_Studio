"use client";

import { useMemo } from "react";

type Props = {
  videoUrl: string;
};

function normalizeVideoUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

type Embed =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | null;

function getEmbed(url: string): Embed {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        };
      }
    }

    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1`,
        };
      }
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) {
        return { kind: "iframe", src: url };
      }
      if (parts[0] === "shorts" && parts[1]) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${parts[1]}?rel=0&modestbranding=1`,
        };
      }
    }

    if (host.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      if (id) {
        return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
      }
    }

    if (host === "drive.google.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const fileIdx = parts.indexOf("file");
      if (fileIdx >= 0 && parts[fileIdx + 2]) {
        const id = parts[fileIdx + 2];
        return { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview` };
      }
      const openId = u.searchParams.get("id");
      if (openId) {
        return { kind: "iframe", src: `https://drive.google.com/file/d/${openId}/preview` };
      }
    }

    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u.pathname)) {
      return { kind: "video", src: url };
    }

    return null;
  } catch {
    return null;
  }
}

export function WalkthroughVideo({ videoUrl }: Props) {
  const embed = useMemo(() => {
    const normalized = normalizeVideoUrl(videoUrl);
    if (!normalized) return null;
    return getEmbed(normalized);
  }, [videoUrl]);

  const videoWrapClass =
    "aspect-video w-full overflow-hidden rounded-2xl bg-stone-900 shadow-lg ring-1 ring-stone-200/50";

  if (!embed) {
    return (
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 px-4 py-3 text-center text-sm text-amber-900">
        Video link couldn&apos;t be embedded. Use YouTube, Vimeo, Google Drive, or a direct video file URL.
      </div>
    );
  }

  return (
    <div className={videoWrapClass} aria-label="Walkthrough video">
      {embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title="Property walkthrough"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <video src={embed.src} controls playsInline className="h-full w-full object-contain">
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
