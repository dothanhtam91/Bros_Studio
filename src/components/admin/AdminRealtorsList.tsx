"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RealtorListItem = {
  id: string;
  slug: string;
  name: string;
  brokerage: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  albums?: { count: number }[] | null;
};

export function AdminRealtorsList({ realtors }: { realtors: RealtorListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return realtors;

    return realtors.filter((realtor) =>
      [realtor.name, realtor.slug, realtor.brokerage, realtor.email, realtor.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    );
  }, [query, realtors]);

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/50 bg-white p-4 shadow-sm shadow-amber-900/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone-900">{filtered.length} realtor{filtered.length === 1 ? "" : "s"}</p>
          <p className="text-xs text-stone-500">Search by name, slug, brokerage, phone, or email.</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search realtors"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-0 transition placeholder:text-stone-400 focus:border-amber-400 sm:max-w-xs"
        />
      </div>

      {!filtered.length ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
          No realtors match that search.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((realtor) => {
            const albumCount = realtor.albums?.[0]?.count ?? 0;

            return (
              <li key={realtor.id}>
                <div className="rounded-2xl border border-amber-200/50 bg-white p-4 shadow-sm shadow-amber-900/5 transition hover:border-amber-200 hover:shadow-md hover:shadow-amber-900/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-medium text-stone-900">{realtor.name}</p>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{albumCount} album{albumCount === 1 ? "" : "s"}</span>
                      </div>
                      <p className="mt-1 text-sm text-stone-500">
                        {realtor.brokerage ?? "No brokerage"} · /r/{realtor.slug}
                      </p>
                      <div className="mt-3 flex flex-col gap-1 text-sm text-stone-600 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
                        <span>{realtor.email || "No email"}</span>
                        <span>{realtor.phone || "No phone"}</span>
                        <span>Updated {new Date(realtor.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/r/${realtor.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                      >
                        View portfolio
                      </Link>
                      <Link
                        href={`/admin/realtors/${realtor.id}`}
                        className="rounded-xl bg-amber-50 border border-amber-200/90 px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
