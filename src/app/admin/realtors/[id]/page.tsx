import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RealtorEditForm } from "@/components/admin/RealtorEditForm";
import { DeleteAlbumButton } from "@/components/admin/DeleteAlbumButton";

export default async function AdminRealtorDetailPage({
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

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id, slug, name, headshot_url, brokerage, phone, email, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin")
    .eq("id", id)
    .single();

  if (!realtor) notFound();

  const { data: albums } = await supabase
    .from("albums")
    .select("id, slug, address, shoot_date")
    .eq("realtor_id", id)
    .order("shoot_date", { ascending: false });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin/realtors" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Realtors
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">{realtor.name}</h1>
        <p className="text-sm text-zinc-500">
          Portfolio (view-only for realtor): <a href={`${baseUrl}/r/${realtor.slug}`} target="_blank" rel="noreferrer" className="text-zinc-700 hover:underline">{baseUrl}/r/{realtor.slug}</a>
        </p>

        <section className="mt-8">
          <RealtorEditForm realtor={realtor} />
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Albums</h2>
            <Link
              href={`/admin/realtors/${id}/albums/new`}
              className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
            >
              Create album
            </Link>
          </div>
          {!albums?.length ? (
          <p className="mt-4 text-zinc-500">No albums yet. Create one, upload images, and share the link—all of it will appear in this realtor’s portfolio.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {albums.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4">
                  <Link
                    href={`/admin/albums/${a.id}`}
                    className="min-w-0 flex-1 transition hover:opacity-80"
                  >
                    <p className="font-medium text-zinc-900">{a.address}</p>
                    <p className="text-sm text-zinc-500">
                      {a.shoot_date ? new Date(a.shoot_date).toLocaleDateString() : "—"} · /r/{realtor.slug}/{a.slug}
                    </p>
                  </Link>
                  <DeleteAlbumButton
                    albumId={a.id}
                    realtorId={id}
                    label="Delete"
                    variant="ghost"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
