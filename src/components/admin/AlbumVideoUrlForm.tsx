"use client";

import { useState } from "react";

type Props = {
  albumId: string;
  initialVideoUrl: string;
};

export function AlbumVideoUrlForm({ albumId, initialVideoUrl }: Props) {
  const [value, setValue] = useState(initialVideoUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: value.trim() || null }),
      });
      if (!res.ok) {
        setMessage("error");
        return;
      }
      setMessage("saved");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4">
      <label className="block text-sm font-medium text-zinc-700">
        Walkthrough video URL (optional)
      </label>
      <p className="mt-0.5 text-xs text-zinc-500">
        YouTube, Vimeo, or direct video URL. Shown on the delivery page below the hero.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://youtube.com/... or https://vimeo.com/..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      {message === "saved" && <p className="mt-2 text-sm text-green-600">Saved.</p>}
      {message === "error" && <p className="mt-2 text-sm text-red-600">Failed to save.</p>}
    </div>
  );
}
