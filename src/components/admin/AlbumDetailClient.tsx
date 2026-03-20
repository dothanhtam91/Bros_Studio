"use client";

import { useState, useRef } from "react";

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
    const fileList = Array.from(files);
    try {
      // 1) Get presigned URLs (avoids Vercel 4.5 MB body limit)
      const presignRes = await fetch(`/api/admin/albums/${albumId}/images/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: fileList.map((f) => ({ name: f.name, type: f.type })) }),
      });
      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        setUploadError((presignData.error as string) || `Upload failed (${presignRes.status})`);
        return;
      }
      const { uploads } = presignData as { uploads: { key: string; url: string; contentType: string }[] };
      if (!uploads?.length) {
        setUploadError("No valid images. Use .jpg, .png, .webp, or .gif.");
        return;
      }
      // 2) Upload each file directly to R2 (browser → R2; requires R2 bucket CORS)
      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        const file = fileList[i];
        if (!file) continue;
        let putRes: Response;
        try {
          putRes = await fetch(u.url, { method: "PUT", body: file, headers: { "Content-Type": u.contentType } });
        } catch (putErr) {
          const msg = putErr instanceof Error ? putErr.message : "Upload failed";
          setUploadError(
            msg.toLowerCase().includes("fetch")
              ? "Upload to storage failed. Check R2 bucket CORS allows your site origin and PUT (see docs/R2_SETUP.md)."
              : `Upload failed: ${msg}`
          );
          return;
        }
        if (!putRes.ok) {
          setUploadError(
            putRes.status === 403
              ? "Storage rejected upload (403). Check R2 bucket CORS allows your site and PUT."
              : `Upload failed for ${file.name} (${putRes.status})`
          );
          return;
        }
      }
      // 3) Confirm and insert into DB
      const confirmRes = await fetch(`/api/admin/albums/${albumId}/images/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: uploads.map((x) => x.key) }),
      });
      const confirmData = await confirmRes.json().catch(() => ({}));
      if (!confirmRes.ok) {
        setUploadError((confirmData.error as string) || "Confirm failed");
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(
        msg.toLowerCase().includes("failed to fetch")
          ? "Upload to storage failed. Check R2 bucket CORS allows your site origin and PUT (see docs/R2_SETUP.md)."
          : msg
      );
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
                {/* Native img so R2 URLs load without Next.js remotePatterns (R2_PUBLIC_URL must be set; bucket must be public) */}
                <img
                  src={img.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
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
