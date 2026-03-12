"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewRealtorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/realtors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug || slugify(name),
          name,
          brokerage: brokerage || null,
          phone: phone || null,
          email: email || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create realtor");
        return;
      }
      router.push(`/admin/realtors/${data.id}`);
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
        <Link href="/admin/realtors" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Realtors
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Add realtor</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Slug (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="jane-doe"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">Portfolio: /r/{slug || "slug"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Brokerage</label>
            <input
              type="text"
              value={brokerage}
              onChange={(e) => setBrokerage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create realtor"}
          </button>
        </form>
      </div>
    </main>
  );
}
