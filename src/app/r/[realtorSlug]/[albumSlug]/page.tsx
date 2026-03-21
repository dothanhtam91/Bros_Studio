import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { DeliveryNav } from "@/components/delivery/DeliveryNav";
import { WalkthroughVideo } from "@/components/delivery/WalkthroughVideo";
import { AlbumGalleryClient } from "@/components/delivery/AlbumGalleryClient";
import { RealtorBrandingCard } from "@/components/delivery/RealtorBrandingCard";
import { DeliveryDeleteAlbumButton } from "@/components/delivery/DeliveryDeleteAlbumButton";
import Link from "next/link";

export default async function AlbumDeliveryPage({
  params,
}: {
  params: Promise<{ realtorSlug: string; albumSlug: string }>;
}) {
  const { realtorSlug, albumSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id, slug, name, headshot_url, brokerage, phone, email, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin")
    .eq("slug", realtorSlug)
    .single();

  if (!realtor) notFound();

  const { data: album } = await supabase
    .from("albums")
    .select("id, slug, address, shoot_date, cover_image_id, video_url")
    .eq("realtor_id", realtor.id)
    .eq("slug", albumSlug)
    .single();

  if (!album) notFound();

  const { data: images } = await supabase
    .from("album_images")
    .select("id, image_url, sort_order")
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true });

  const imageList = images ?? [];
  const coverImageUrl =
    album.cover_image_id && imageList.length > 0
      ? imageList.find((img) => img.id === album.cover_image_id)?.image_url ?? imageList[0]?.image_url
      : imageList[0]?.image_url ?? null;

  const shootDateFormatted = album.shoot_date
    ? new Date(album.shoot_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-stone-100">
      <DeliveryNav backHref={`/r/${realtorSlug}`} backLabel="All albums" />

      {/* Hero — cinematic cover, no text */}
      <section className="relative aspect-[16/10] w-full min-h-[70vh] sm:min-h-[80vh]" aria-label="Property">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-stone-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Property details — luxury info box */}
      <section className="relative z-10 -mt-14 sm:-mt-20" aria-label="Details">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/95 to-stone-50/90 shadow-xl shadow-amber-900/5 p-8 sm:p-10">
            <div className="border-l-4 border-amber-400/90 pl-6 sm:pl-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/90">Property</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-stone-800 sm:text-3xl">
                {album.address}
              </h2>
              {shootDateFormatted && (
                <p className="mt-3 text-sm font-medium text-amber-800/80">
                  Shoot date — {shootDateFormatted}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Photo gallery + walkthrough video together */}
      <section className="py-16 sm:py-20 lg:py-24" aria-label="Photo gallery">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="mb-10 sm:mb-12">
            <h2 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
              Photo gallery
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {imageList.length} {imageList.length === 1 ? "photo" : "photos"}
            </p>
          </header>

          {album.video_url && (
            <div className="mb-10 sm:mb-12">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
                Walkthrough video
              </h3>
              <WalkthroughVideo videoUrl={album.video_url} />
            </div>
          )}

          {imageList.length > 0 ? (
            <AlbumGalleryClient
              albumId={album.id}
              images={imageList}
              address={album.address ?? undefined}
            />
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white/80 py-16 text-center">
              <p className="text-stone-500">No photos in this album yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Agent */}
      <RealtorBrandingCard realtor={realtor} />

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/50 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <Link
              href={`/r/${realtorSlug}`}
              className="text-sm font-medium text-stone-500 transition hover:text-amber-800"
            >
              ← Back to {realtor.name}&apos;s listings
            </Link>
            {isAdmin && (
              <DeliveryDeleteAlbumButton albumId={album.id} realtorId={realtor.id} />
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}
