"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type RealtorProfile = {
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
  linkedin?: string | null;
};

export function RealtorSelfEditPanel({ realtor }: { realtor: RealtorProfile }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [name, setName] = useState(realtor.name);
  const [slug, setSlug] = useState(realtor.slug);
  const [brokerage, setBrokerage] = useState(realtor.brokerage ?? "");
  const [phone, setPhone] = useState(realtor.phone ?? "");
  const [email, setEmail] = useState(realtor.email ?? "");
  const [title, setTitle] = useState(realtor.title ?? "");
  const [website, setWebsite] = useState(realtor.website ?? "");
  const [tagline, setTagline] = useState(realtor.tagline ?? "");
  const [instagram, setInstagram] = useState(realtor.instagram ?? "");
  const [facebook, setFacebook] = useState(realtor.facebook ?? "");
  const [linkedin, setLinkedin] = useState(realtor.linkedin ?? "");
  const [brokerageLogoUrl, setBrokerageLogoUrl] = useState(realtor.brokerage_logo_url ?? "");
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(realtor.headshot_url);

  const onUploadHeadshot = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/realtor/profile/headshot", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "err", text: (data.error as string) || "Upload failed" });
        return;
      }
      if (data.headshot_url) {
        setHeadshotUrl(data.headshot_url as string);
        setMsg({ type: "ok", text: "Headshot uploaded." });
      }
    } catch {
      setMsg({ type: "err", text: "Upload failed" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/realtor/profile", {
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "err", text: (data.error as string) || "Update failed" });
        return;
      }
      setMsg({ type: "ok", text: "Profile updated." });
      const nextSlug = (data.realtor?.slug as string | undefined) || slug;
      if (nextSlug && nextSlug !== realtor.slug) {
        router.push(`/r/${nextSlug}`);
      } else {
        router.refresh();
      }
    } catch {
      setMsg({ type: "err", text: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">Your profile settings</p>
          <p className="text-xs text-zinc-500">Update what clients see on this portfolio page.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
        >
          {open ? "Close editor" : "Edit profile"}
        </button>
      </div>

      {open && (
        <form onSubmit={onSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Headshot</label>
            <div className="mt-2 flex flex-wrap items-start gap-4">
              {headshotUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-zinc-100">
                  <Image src={headshotUrl} alt="Headshot" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-200 text-xl font-semibold text-zinc-500">
                  {name.charAt(0) || "?"}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUploadHeadshot(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Upload photo"}
                </button>
                <input
                  type="url"
                  value={headshotUrl ?? ""}
                  onChange={(e) => setHeadshotUrl(e.target.value || null)}
                  placeholder="Or paste image URL"
                  className="w-64 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Slug</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Brokerage</label>
              <input type="text" value={brokerage} onChange={(e) => setBrokerage(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Website</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Tagline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Instagram</label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Facebook</label>
              <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">HAR profile URL</label>
              <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Brokerage logo URL</label>
              <input type="url" value={brokerageLogoUrl} onChange={(e) => setBrokerageLogoUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900" />
            </div>
          </div>

          {msg && (
            <p className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-50 border border-amber-200/90 px-6 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </section>
  );
}
