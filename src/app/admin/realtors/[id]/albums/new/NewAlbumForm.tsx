"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = { realtorId: string };

export default function NewAlbumForm({ realtorId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [shootDate, setShootDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realtor_id: realtorId,
          address: address.trim(),
          shoot_date: shootDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create album");
        return;
      }
      router.push(`/admin/albums/${data.id}`);
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <Link href={`/admin/realtors/${realtorId}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Realtor
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Create album</h1>
        <p className="mt-1 text-sm text-zinc-600">Slug is generated from the address (e.g. 16534-whitaker-creek-dr-houston-tx-77095).</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="16534 Whitaker Creek Dr, Houston, TX 77095"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Shoot date</label>
            <input
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create album"}
          </button>
        </form>
      </div>
    </main>
  );
}
