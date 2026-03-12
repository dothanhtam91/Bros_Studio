import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminJobsList } from "@/components/admin/AdminJobsList";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, source, realtor_id, customer_id, album_id, property_address, status, shooting_date, delivery_deadline, created_at")
    .order("created_at", { ascending: false });

  const realtorIds = [...new Set((jobs || []).map((j) => j.realtor_id).filter(Boolean))] as string[];
  const customerIds = [...new Set((jobs || []).map((j) => j.customer_id).filter(Boolean))] as string[];

  const { data: realtors } = realtorIds.length
    ? await supabase.from("realtors").select("id, name").in("id", realtorIds)
    : { data: [] };
  const { data: customers } = customerIds.length
    ? await supabase.from("customers").select("id, name").in("id", customerIds)
    : { data: [] };

  const realtorMap = Object.fromEntries((realtors || []).map((r) => [r.id, r.name]));
  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id, c.name]));

  const jobsWithContact = (jobs || []).map((j) => ({
    ...j,
    contact_name: j.realtor_id ? realtorMap[j.realtor_id] : (j.customer_id ? customerMap[j.customer_id] : "—"),
  }));

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-stone-900">Admin – Jobs</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/analytics"
              className="text-sm font-medium text-stone-600 hover:text-amber-800 transition"
            >
              Analytics
            </Link>
            <Link
              href="/admin/notifications"
              className="text-sm font-medium text-stone-600 hover:text-amber-800 transition"
            >
              Notifications
            </Link>
            <Link
              href="/admin/portfolio"
              className="text-sm font-medium text-stone-600 hover:text-amber-800 transition"
            >
              Portfolio
            </Link>
            <Link
              href="/admin/realtors"
              className="text-sm font-medium text-stone-600 hover:text-amber-800 transition"
            >
              Realtors
            </Link>
            <Link
              href="/admin/jobs/new"
              className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 transition"
            >
              New job
            </Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-sm font-medium text-stone-600 hover:text-amber-800 transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          Unified job management: admin-created jobs and website bookings in one place.
        </p>
        <AdminJobsList jobs={jobsWithContact} />
      </div>
    </main>
  );
}
