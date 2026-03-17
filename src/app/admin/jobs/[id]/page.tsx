import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminJobDetail } from "@/components/admin/AdminJobDetail";

export default async function AdminJobPage({
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

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const [realtorRes, customerRes, albumRes, timelineRes, revisionsRes] = await Promise.all([
    job.realtor_id ? supabase.from("realtors").select("*").eq("id", job.realtor_id).single() : Promise.resolve({ data: null }),
    job.customer_id ? supabase.from("customers").select("*").eq("id", job.customer_id).single() : Promise.resolve({ data: null }),
    job.album_id ? supabase.from("albums").select("id, slug, address, shoot_date, realtor_id").eq("id", job.album_id).single() : Promise.resolve({ data: null }),
    supabase.from("job_timeline_events").select("*").eq("job_id", id).order("created_at", { ascending: false }),
    supabase.from("revision_requests").select("*").eq("job_id", id).order("created_at", { ascending: false }),
  ]);

  const album = albumRes.data;
  let realtorSlug: string | null = null;
  if (album?.realtor_id) {
    const { data: r } = await supabase.from("realtors").select("slug").eq("id", album.realtor_id).single();
    realtorSlug = r?.slug ?? null;
  }

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-stone-600 transition hover:text-amber-800">
          ← Jobs
        </Link>
        <AdminJobDetail
          job={job}
          realtor={realtorRes.data ?? null}
          customer={customerRes.data ?? null}
          album={album ? { ...album, realtor_slug: realtorSlug } : null}
          timeline={timelineRes.data ?? []}
          revisionRequests={revisionsRes.data ?? []}
        />
      </div>
    </main>
  );
}
