import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AlbumDetailClient } from "@/components/admin/AlbumDetailClient";
import { AlbumVideoUrlForm } from "@/components/admin/AlbumVideoUrlForm";
import { DeleteAlbumButton } from "@/components/admin/DeleteAlbumButton";

export default async function AdminAlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: album } = await supabase
    .from("albums")
    .select("id, slug, address, shoot_date, realtor_id, cover_image_id, video_url")
    .eq("id", id)
    .single();

  if (!album) notFound();

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id, slug, name")
    .eq("id", album.realtor_id)
    .single();

  const { data: images } = await supabase
    .from("album_images")
    .select("id, image_url, sort_order")
    .eq("album_id", id)
    .order("sort_order", { ascending: true });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const deliveryUrl = realtor ? `${baseUrl}/r/${realtor.slug}/${album.slug}` : "";

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href={`/admin/realtors/${album.realtor_id}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← {realtor?.name ?? "Realtor"}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">{album.address}</h1>
        <p className="text-sm text-zinc-500">
          {album.shoot_date ? new Date(album.shoot_date).toLocaleDateString() : "—"} · {album.slug}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <span className="text-sm font-medium text-zinc-700">Delivery link:</span>
          <code className="flex-1 truncate rounded bg-white px-2 py-1 text-sm text-zinc-800">
            {deliveryUrl}
          </code>
          <AlbumDetailClient albumId={id} deliveryUrl={deliveryUrl} copyOnly />
        </div>

        <AlbumVideoUrlForm albumId={id} initialVideoUrl={album.video_url ?? ""} />

        <div className="mt-8 flex items-center gap-4">
          <DeleteAlbumButton albumId={id} realtorId={album.realtor_id} />
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-zinc-900">Images</h2>
          <p className="mt-1 text-sm text-zinc-600">Upload images, then set one as the cover for the album card on the portfolio page.</p>
          <AlbumDetailClient
            albumId={id}
            images={images || []}
            coverImageId={album.cover_image_id}
            deliveryUrl={deliveryUrl}
            showUpload
          />
        </section>
      </div>
    </main>
  );
}
