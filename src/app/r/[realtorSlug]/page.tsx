import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RealtorHeader } from "@/components/delivery/RealtorHeader";
import { AlbumCard } from "@/components/delivery/AlbumCard";

export default async function RealtorPortfolioPage({
  params,
}: {
  params: Promise<{ realtorSlug: string }>;
}) {
  const { realtorSlug } = await params;
  const supabase = await createClient();

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id, slug, name, headshot_url, brokerage, phone, email")
    .eq("slug", realtorSlug)
    .single();

  if (!realtor) notFound();

  const { data: albums } = await supabase
    .from("albums")
    .select("id, slug, address, shoot_date, cover_image_id")
    .eq("realtor_id", realtor.id)
    .order("shoot_date", { ascending: false });

  const coverIds = (albums || [])
    .map((a) => a.cover_image_id)
    .filter(Boolean) as string[];
  let coverUrlMap: Record<string, string> = {};
  if (coverIds.length) {
    const { data: coverImages } = await supabase
      .from("album_images")
      .select("id, image_url")
      .in("id", coverIds);
    coverUrlMap = Object.fromEntries(
      (coverImages || []).map((img) => [img.id, img.image_url])
    );
  }

  const albumCards = (albums || []).map((a) => ({
    slug: a.slug,
    address: a.address,
    shoot_date: a.shoot_date,
    cover_image_url: (a.cover_image_id && coverUrlMap[a.cover_image_id]) || null,
    realtor_slug: realtor.slug,
  }));

  return (
    <main className="min-h-screen bg-stone-50 pt-24">
      <RealtorHeader realtor={realtor} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-stone-900 border-b border-amber-200/60 pb-2 inline-block">
          Albums
        </h2>
        {albumCards.length === 0 ? (
          <p className="text-stone-500">No albums yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albumCards.map((album) => (
              <AlbumCard key={album.slug} album={album} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
