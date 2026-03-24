import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPortfolioUpload } from "@/components/admin/AdminPortfolioUpload";
import { AdminStudioPortfolioList } from "@/components/admin/AdminStudioPortfolioList";
import { getR2Config, getR2PublicUrl, normalizePortfolioR2Key } from "@/lib/r2/client";

export default async function AdminPortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: rows } = await supabase
    .from("portfolio_items")
    .select("id, name, folder_label, drive_file_id")
    .is("user_id", null)
    .order("sort_order", { ascending: true });

  const r2Ok = getR2Config().configured;
  const listItems =
    rows?.map((row) => ({
      id: row.id,
      name: row.name,
      folder_label: row.folder_label,
      imageUrl: r2Ok ? getR2PublicUrl(normalizePortfolioR2Key(row.drive_file_id)) : null,
    })) ?? [];

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Portfolio images</h1>
        <p className="mt-1 text-zinc-600">
          Upload images from your device. They appear on the public Portfolio page. Set or fix categories for older uploads below.
        </p>
        <section className="mt-6">
          <AdminPortfolioUpload />
        </section>
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900">Studio gallery &amp; categories</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Each image needs a category (Drone, Interior, etc.) to show under the right filter. Legacy uploads may show “Select category…”.
          </p>
          {!r2Ok && listItems.length > 0 && (
            <p className="mt-2 text-sm text-amber-800">
              R2 is not configured — thumbnails may not load until R2 env vars are set.
            </p>
          )}
          <div className="mt-4">
            <AdminStudioPortfolioList items={listItems} />
          </div>
        </section>
      </div>
    </main>
  );
}
