"use client";

import { useState, useRef } from "react";

export function UserPortfolioUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/user/portfolio/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Upload failed." });
        return;
      }
      setMessage({ type: "ok", text: `Uploaded ${data.uploaded} image(s).` });
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
      window.location.reload();
    } catch {
      setMessage({ type: "err", text: "Request failed." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Upload images to your personal portfolio. JPG, PNG, WebP, or GIF.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-xl file:border file:border-amber-200/90 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-800 file:hover:bg-amber-100/90"
        />
      </div>
      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
      {uploading && <p className="text-sm text-zinc-500">Uploading…</p>}
    </div>
  );
}
