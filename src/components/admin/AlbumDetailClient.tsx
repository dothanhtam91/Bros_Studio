"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type ImageRow = { id: string; image_url: string; sort_order: number };

type Props = {
  albumId: string;
  deliveryUrl: string;
  copyOnly?: boolean;
  showUpload?: boolean;
  images?: ImageRow[];
  coverImageId?: string | null;
};

export function AlbumDetailClient({
  albumId,
  deliveryUrl,
  copyOnly,
  showUpload,
  images = [],
  coverImageId,
}: Props) {
  const [copyDone, setCopyDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverSetting, setCoverSetting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    if (!deliveryUrl) return;
    await navigator.clipboard.writeText(deliveryUrl);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    try {
      const res = await fetch(`/api/admin/albums/${albumId}/images`, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError((data.error as string) || `Upload failed (${res.status})`);
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      window.location.reload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = async (imageId: string) => {
    setCoverSetting(imageId);
    try {
      await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image_id: imageId }),
      });
      window.location.reload();
    } finally {
      setCoverSetting(null);
    }
  };

  if (copyOnly) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
      >
        {copyDone ? "Copied!" : "Copy link"}
      </button>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {showUpload && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm file:mr-4 file:rounded-xl file:border file:border-amber-200/90 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-800 file:hover:bg-amber-100/90"
          />
          {uploading && <p className="mt-2 text-sm text-zinc-500">Uploading…</p>}
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className={`overflow-hidden rounded-lg border bg-white ${
                coverImageId === img.id ? "ring-2 ring-zinc-900" : "border-zinc-200"
              }`}
            >
              <div className="aspect-[4/3] bg-zinc-200">
                <Image
                  src={img.image_url}
                  alt=""
                  width={400}
                  height={300}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => handleSetCover(img.id)}
                  disabled={coverSetting !== null}
                  className="w-full rounded bg-zinc-100 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                >
                  {coverImageId === img.id ? "Cover" : coverSetting === img.id ? "Setting…" : "Set as cover"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
