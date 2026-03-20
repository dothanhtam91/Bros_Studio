"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  albumId: string;
  realtorId: string;
};

export function DeliveryDeleteAlbumButton({ albumId, realtorId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState<"keep" | "delete" | null>(null);

  const handleDelete = async (jobHandling: "keep" | "delete") => {
    setDeleting(jobHandling);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobHandling }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data.error as string) || "Failed to delete album");
        return;
      }
      router.push(`/admin/realtors/${realtorId}`);
      router.refresh();
    } finally {
      setDeleting(null);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-600">Delete album and images. What about linked job?</span>
        <button
          type="button"
          onClick={() => handleDelete("keep")}
          disabled={deleting !== null}
          className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
        >
          {deleting === "keep" ? "Deleting…" : "Keep job"}
        </button>
        <button
          type="button"
          onClick={() => handleDelete("delete")}
          disabled={deleting !== null}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {deleting === "delete" ? "Deleting…" : "Delete job too"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting !== null}
          className="rounded-xl border border-amber-200/80 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-amber-50/80 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100/80"
    >
      Delete album
    </button>
  );
}
