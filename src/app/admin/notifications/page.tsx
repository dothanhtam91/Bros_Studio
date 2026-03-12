import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminNotificationsList } from "@/components/admin/AdminNotificationsList";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, job_id, type, title, message, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-stone-600 hover:text-amber-800 transition">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">Notifications</h1>
        <p className="mt-1 text-sm text-stone-600">
          New bookings, unmatched bookings, revision requests, and overdue jobs.
        </p>
        <AdminNotificationsList notifications={notifications ?? []} />
      </div>
    </main>
  );
}
