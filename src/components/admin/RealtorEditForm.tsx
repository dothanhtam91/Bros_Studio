"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type Realtor = {
  id: string;
  slug: string;
  name: string;
  headshot_url: string | null;
  brokerage: string | null;
  phone: string | null;
  email: string | null;
  title?: string | null;
  website?: string | null;
  brokerage_logo_url?: string | null;
  tagline?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null; /* stored as HAR profile URL */
};

export function RealtorEditForm({ realtor }: { realtor: Realtor }) {
  const [name, setName] = useState(realtor.name);
  const [slug, setSlug] = useState(realtor.slug);
  const [brokerage, setBrokerage] = useState(realtor.brokerage ?? "");
  const [phone, setPhone] = useState(realtor.phone ?? "");
  const [email, setEmail] = useState(realtor.email ?? "");
  const [title, setTitle] = useState(realtor.title ?? "");
  const [website, setWebsite] = useState(realtor.website ?? "");
  const [brokerageLogoUrl, setBrokerageLogoUrl] = useState(realtor.brokerage_logo_url ?? "");
  const [tagline, setTagline] = useState(realtor.tagline ?? "");
  const [instagram, setInstagram] = useState(realtor.instagram ?? "");
  const [facebook, setFacebook] = useState(realtor.facebook ?? "");
  const [linkedin, setLinkedin] = useState(realtor.linkedin ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(realtor.headshot_url);
  const [headshotUploading, setHeadshotUploading] = useState(false);
  const headshotInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/realtors/${realtor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          brokerage: brokerage || null,
          phone: phone || null,
          email: email || null,
          headshot_url: headshotUrl || null,
          title: title || null,
          website: website || null,
          brokerage_logo_url: brokerageLogoUrl || null,
          tagline: tagline || null,
          instagram: instagram || null,
          facebook: facebook || null,
          linkedin: linkedin || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Update failed" });
        return;
      }
      setMessage({ type: "ok", text: "Saved." });
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Headshot</label>
        <div className="mt-2 flex flex-wrap items-start gap-4">
          {headshotUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-zinc-100">
              <Image
                src={headshotUrl}
                alt="Headshot"
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-zinc-200 text-2xl font-semibold text-zinc-500">
              {name.charAt(0) || "?"}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={headshotInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setHeadshotUploading(true);
                try {
                  const form = new FormData();
                  form.append("file", f);
                  const res = await fetch(`/api/admin/realtors/${realtor.id}/headshot`, {
                    method: "POST",
                    body: form,
                  });
                  const data = await res.json();
                  if (res.ok && data.headshot_url) {
                    setHeadshotUrl(data.headshot_url);
                  } else {
                    setMessage({ type: "err", text: (data.error as string) || "Upload failed" });
                  }
                } catch {
                  setMessage({ type: "err", text: "Upload failed" });
                } finally {
                  setHeadshotUploading(false);
                  if (headshotInputRef.current) headshotInputRef.current.value = "";
                }
              }}
            />
            <button
              type="button"
              onClick={() => headshotInputRef.current?.click()}
              disabled={headshotUploading}
              className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
            >
              {headshotUploading ? "Uploading…" : "Upload photo"}
            </button>
            <p className="text-xs text-zinc-500">Or paste URL below when saving.</p>
          </div>
        </div>
        <input
          type="url"
          value={headshotUrl ?? ""}
          onChange={(e) => setHeadshotUrl(e.target.value || null)}
          placeholder="https://... or upload above"
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
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
      <div>
        <label className="block text-sm font-medium text-zinc-700">Title (e.g. Realtor®, Broker Associate)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Realtor®"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Website</label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Brokerage logo URL</label>
        <input
          type="url"
          value={brokerageLogoUrl}
          onChange={(e) => setBrokerageLogoUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Tagline / Slogan</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Your success is my priority"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Instagram</label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@handle or URL"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Facebook</label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="URL or username"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">HAR</label>
          <input
            type="text"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="HAR profile URL"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
      </div>
      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-amber-50 border border-amber-200/90 px-6 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
