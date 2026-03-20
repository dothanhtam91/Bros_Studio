import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeVideoUrl(raw?: string | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function getEmbeddedVideo(url: string):
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        };
      }
    }

    if (host.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        };
      }

      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) {
        return { kind: "iframe", src: url };
      }
      // Support youtube.com/shorts/{id}
      if (parts[0] === "shorts" && parts[1]) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${parts[1]}?rel=0&modestbranding=1`,
        };
      }
    }

    if (host.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      if (id) {
        return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
      }
    }

    // Support Google Drive share links
    if (host === "drive.google.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const fileIdx = parts.indexOf("file");
      if (fileIdx >= 0 && parts[fileIdx + 2]) {
        const id = parts[fileIdx + 2];
        return { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview` };
      }
      const openId = u.searchParams.get("id");
      if (openId) {
        return { kind: "iframe", src: `https://drive.google.com/file/d/${openId}/preview` };
      }
    }

    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u.pathname)) {
      return { kind: "video", src: url };
    }

    return null;
  } catch {
    return null;
  }
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id, property_address, service_type, status, delivered_at, album_id, notes")
    .eq("delivery_token", token)
    .single();

  if (jobErr || !job) notFound();

  const isDelivered = job.status === "delivered" && job.delivered_at && job.album_id;
  if (!isDelivered) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-zinc-900">
        <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-5">
            <span className="text-lg font-semibold tracking-tight text-stone-800">BrosStudio</span>
          </div>
        </header>
        <section className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-10 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-stone-900">Delivery not ready yet</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Your photos are still being prepared. We\'ll notify you as soon as your delivery is ready.
            </p>
            <p className="mt-6 text-xs text-zinc-500">
              If you believe this is an error, please contact your photographer.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const { data: album } = await admin
    .from("albums")
    .select("id, slug, realtor_id, cover_image_id, video_url")
    .eq("id", job.album_id!)
    .single();
  if (!album) notFound();

  const { data: imageList } = await admin
    .from("album_images")
    .select("id, image_url, sort_order")
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true });

  const coverImageUrl =
    album.cover_image_id && (imageList?.length ?? 0) > 0
      ? imageList?.find((img) => img.id === album.cover_image_id)?.image_url ?? imageList?.[0]?.image_url ?? null
      : imageList?.[0]?.image_url ?? null;

  const normalizedVideoUrl = normalizeVideoUrl(album.video_url);
  const embeddedVideo = normalizedVideoUrl ? getEmbeddedVideo(normalizedVideoUrl) : null;

  const { data: realtor } = await admin
    .from("realtors")
    .select("slug")
    .eq("id", album.realtor_id)
    .single();
  const albumUrl = realtor?.slug
    ? `/r/${realtor.slug}/${album.slug}`
    : null;

  const deliveredDate = job.delivered_at
    ? new Date(job.delivered_at).toLocaleDateString("en-US", { dateStyle: "long" })
    : null;

  return (
    <main className="min-h-screen bg-[var(--background)] text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-5">
          <span className="text-lg font-semibold tracking-tight text-stone-800">BrosStudio</span>
        </div>
      </header>

      <section className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <div className="animate-fade-in-up rounded-3xl border border-[var(--brand-card-border)] bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)]">
              <svg className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-900">Your photos are ready</h1>
              <p className="text-sm text-zinc-500">Delivery for your property</p>
            </div>
          </div>

          {coverImageUrl && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100">
              <img
                src={coverImageUrl}
                alt="Property cover"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {embeddedVideo && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100">
              <div className="aspect-video w-full">
                {embeddedVideo.kind === "iframe" ? (
                  <iframe
                    src={embeddedVideo.src}
                    title="Video walkthrough"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={embeddedVideo.src}
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          <dl className="space-y-4 border-t border-zinc-100 pt-6">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Property</dt>
              <dd className="mt-1 text-sm font-medium text-stone-800">{job.property_address}</dd>
            </div>
            {job.service_type && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Service</dt>
                <dd className="mt-1 text-sm font-medium text-stone-800">{job.service_type}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Delivery status</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-stone-800">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Delivered {deliveredDate ? `on ${deliveredDate}` : ""}
              </dd>
            </div>
          </dl>

          {job.notes && (
            <div className="mt-6 rounded-2xl bg-zinc-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{job.notes}</p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {albumUrl && (
              <Link
                href={albumUrl}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-accent)] px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--brand-accent-hover)] active:scale-[0.98]"
              >
                View your photos
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}

            {!embeddedVideo && normalizedVideoUrl && (
              <p className="rounded-xl border border-amber-200/70 bg-amber-50/40 px-3 py-2 text-center text-xs text-amber-800">
                Video link is saved but not embeddable in-page. Use a YouTube, Vimeo, Google Drive, or direct video file URL.
              </p>
            )}

            <p className="mt-3 text-center text-xs text-zinc-500">
              Opens your album in a new page. You can download or share from there.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Thank you for choosing BrosStudio. Questions? Reply to the email we sent you.
        </p>
      </section>
    </main>
  );
}
