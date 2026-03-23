"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  realtorId: string;
  realtorName: string;
};

export function DeleteRealtorButton({ realtorId, realtorName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/realtors/${realtorId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || "Failed to delete realtor");
        return;
      }
      setOpen(false);
      router.push("/admin/realtors");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="rounded-xl border border-red-200/80 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
      >
        Delete realtor
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !deleting && setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-realtor-title"
          >
            <h3 id="delete-realtor-title" className="text-lg font-semibold text-zinc-900">
              Delete realtor?
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Permanently remove <span className="font-medium text-zinc-800">{realtorName}</span> and all of their
              albums and photos. Jobs linked to this realtor will keep the job record but lose the realtor link.
            </p>
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => !deleting && setOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl border border-red-200 bg-red-100 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-200/80 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
