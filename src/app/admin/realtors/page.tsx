import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminRealtorsList } from "@/components/admin/AdminRealtorsList";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRealtorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: realtors } = await supabase
    .from("realtors")
    .select("id, slug, name, brokerage, phone, email, created_at, updated_at, albums(count)")
    .order("name");

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-sm font-medium text-stone-600 hover:text-amber-800 transition">
            ← Admin
          </Link>
          <Link
            href="/admin/realtors/new"
            className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 transition"
          >
            Add realtor
          </Link>
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">Realtors</h1>
        <p className="mt-1 text-sm text-stone-600">
          You manage realtor portfolios: add realtors, create albums, and upload images. Realtors do not log in or upload—they only receive links to their portfolio and albums. Share portfolio: <code className="rounded bg-stone-100 px-1">/r/[slug]</code>. Share album: <code className="rounded bg-stone-100 px-1">/r/[realtorSlug]/[albumSlug]</code>.
        </p>
        {!realtors?.length ? (
          <p className="mt-8 text-stone-500">No realtors yet. Add one to get started.</p>
        ) : (
          <AdminRealtorsList realtors={realtors} />
        )}
      </div>
    </main>
  );
}
