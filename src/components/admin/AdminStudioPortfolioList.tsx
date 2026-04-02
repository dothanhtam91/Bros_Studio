"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  STUDIO_PORTFOLIO_CATEGORIES,
  isStudioPortfolioCategorySlug,
} from "@/lib/portfolioCategories";

export type StudioPortfolioRow = {
  id: string;
  name: string;
  folder_label: string | null;
  /** Null when R2 is not configured — no preview URL available. */
  imageUrl: string | null;
};

export function AdminStudioPortfolioList({ items }: { items: StudioPortfolioRow[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateCategory(id: string, folder_label: string) {
    if (!folder_label) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteItem(id: string, name: string) {
    if (
      !window.confirm(
        `Delete this image from the studio portfolio?\n\n${name}\n\nThis removes it from the public Portfolio and deletes the file from storage (if configured).`
      )
    ) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-6 text-center text-sm text-zinc-600">
        No studio portfolio images yet. Upload above to add images.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ul className="divide-y divide-zinc-200/80 rounded-2xl border border-zinc-200/80 bg-white">
        {items.map((item) => {
          const raw = item.folder_label?.trim().toLowerCase() ?? "";
          const valid = raw.length > 0 && isStudioPortfolioCategorySlug(raw);
          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-28">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 7rem"
                    unoptimized
                  />
                ) : (
                  <span className="px-2 text-center text-[11px] font-medium text-zinc-400">
                    No preview
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                {!valid && (
                  <p className="mt-1 text-xs text-amber-700">
                    Legacy or missing category — choose one so it appears in the right filter on the public portfolio.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:w-52">
                <label className="sr-only" htmlFor={`cat-${item.id}`}>
                  Category for {item.name}
                </label>
                <select
                  id={`cat-${item.id}`}
                  value={valid ? raw : ""}
                  disabled={savingId === item.id || deletingId === item.id}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) void updateCategory(item.id, v);
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/50 disabled:opacity-60"
                >
                  <option value="">Select category…</option>
                  {STUDIO_PORTFOLIO_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {savingId === item.id && (
                  <p className="text-xs text-zinc-500">Saving…</p>
                )}
                <button
                  type="button"
                  disabled={deletingId === item.id || savingId === item.id}
                  onClick={() => void deleteItem(item.id, item.name)}
                  className="w-full rounded-xl border border-red-200/90 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === item.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
