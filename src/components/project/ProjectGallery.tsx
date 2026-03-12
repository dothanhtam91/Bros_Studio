"use client";

import { useState } from "react";
import type { Asset } from "@/lib/db/types";

interface ProjectGalleryProps {
  projectId: string;
  assets: Pick<Asset, "id" | "type" | "variant" | "storage_key" | "sort_order" | "mls_filename">[];
  canDownload: boolean;
}

export function ProjectGallery({ projectId, assets, canDownload }: ProjectGalleryProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);

  const photos = assets.filter((a) => a.type === "photo");
  const videos = assets.filter((a) => a.type === "video" || a.type === "reel");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownloadAll = async () => {
    const res = await fetch(`/api/projects/${projectId}/download?variant=all`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BrosStudio-${projectId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSelected = async () => {
    if (selected.size === 0) return;
    const res = await fetch(`/api/projects/${projectId}/download?variant=selected`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetIds: Array.from(selected) }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BrosStudio-selected.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!photos.length && !videos.length) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-600">
        No assets yet. We’ll add your photos and video when they’re ready.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {photos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((asset) => (
            <div
              key={asset.id}
              className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-zinc-100"
              onClick={() => setLightbox(asset.id)}
            >
              {/* Use Supabase storage or placeholder */}
              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-500">
                Photo {asset.sort_order + 1}
                {asset.mls_filename && (
                  <span className="ml-1 text-xs">({asset.mls_filename})</span>
                )}
              </div>
              {canDownload && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(asset.id);
                  }}
                  className={`absolute right-2 top-2 rounded-lg border-2 p-1 ${
                    selected.has(asset.id)
                      ? "border-amber-300 bg-amber-50 text-stone-800"
                      : "border-white bg-white/90 text-stone-700"
                  }`}
                  aria-label={selected.has(asset.id) ? "Deselect" : "Select"}
                >
                  {selected.has(asset.id) ? "✓" : "○"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-zinc-700">Video</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {videos.map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl bg-zinc-100 p-4"
              >
                {asset.type === "reel" ? "Reel" : "Walkthrough"} – {asset.storage_key}
              </div>
            ))}
          </div>
        </div>
      )}

      {canDownload && (photos.length > 0 || videos.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadAll}
            className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
          >
            Download all
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleDownloadSelected}
              className="rounded-xl border border-amber-200/80 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-amber-50/80"
            >
              Download selected ({selected.size})
            </button>
          )}
        </div>
      )}

      {!canDownload && (
        <p className="mt-4 text-sm text-zinc-600">
          Pay the invoice to unlock downloads.
        </p>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-full max-w-full p-4">
            <div className="rounded-lg bg-zinc-800 p-8 text-white">
              Photo view – close to go back
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
