import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartStr = weekStart.toISOString();
  const todayStr = now.toISOString().slice(0, 10);

  const [
    { count: activeCount },
    { count: deliveredCount },
    { count: deliveredThisWeekCount },
    { data: overdueJobsData },
    { count: revisionsCount },
    jobsForTurnaround,
    jobsForRevenue,
    { count: websiteThisWeek },
    { count: adminThisWeek },
  ] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }).in("status", ["new_booking", "pending_confirmation", "scheduled", "shooting", "editing", "review", "revision_requested"]),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "delivered"),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "delivered").gte("delivered_at", weekStartStr),
    admin.from("jobs").select("id, status").lt("delivery_deadline", todayStr),
    admin.from("revision_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("jobs").select("delivered_at, created_at").not("delivered_at", "is", null),
    admin.from("jobs").select("total_price, source").not("total_price", "is", null),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("source", "website_booking").gte("created_at", weekStartStr),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("source", "admin_created").gte("created_at", weekStartStr),
  ]);

  const completedStatuses = ["completed", "cancelled", "delivered"];
  const overdueCount = (overdueJobsData || []).filter(
    (j) => !completedStatuses.includes((j as { status?: string }).status ?? "")
  ).length;

  const turnaroundTimes = (jobsForTurnaround.data || []).map((j) => {
    const created = new Date(j.created_at).getTime();
    const delivered = new Date(j.delivered_at!).getTime();
    return (delivered - created) / (1000 * 60 * 60 * 24);
  });
  const avgTurnaround = turnaroundTimes.length
    ? turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length
    : null;

  const totalRevenue = (jobsForRevenue.data || []).reduce((sum, j) => sum + Number(j.total_price || 0), 0);
  const revenueBySource = (jobsForRevenue.data || []).reduce(
    (acc, j) => {
      const s = j.source || "unknown";
      acc[s] = (acc[s] || 0) + Number(j.total_price || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const statuses = ["new_booking", "pending_confirmation", "scheduled", "shooting", "editing", "review", "delivered", "revision_requested", "completed", "cancelled"];
  const jobsByStatus: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (st) => {
      const { count } = await admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", st);
      jobsByStatus[st] = count ?? 0;
    })
  );

  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const { data: jobsForWeeks } = await admin
    .from("jobs")
    .select("id, created_at, source")
    .gte("created_at", eightWeeksAgo.toISOString());
  const bookingsByWeek: { week: string; website: number; admin: number; total: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    let website = 0;
    let admin = 0;
    (jobsForWeeks || []).forEach((j) => {
      const t = new Date(j.created_at).getTime();
      if (t >= weekStart.getTime() && t < weekEnd.getTime()) {
        if (j.source === "website_booking") website++;
        else admin++;
      }
    });
    bookingsByWeek.push({ week: weekLabel, website, admin, total: website + admin });
  }

  // Revenue over time (by week of delivery; integer dollars per week)
  const { data: jobsForRevenueTime } = await admin
    .from("jobs")
    .select("delivered_at, total_price")
    .not("delivered_at", "is", null)
    .not("total_price", "is", null)
    .gte("delivered_at", eightWeeksAgo.toISOString());
  const revenueByWeek: { week: string; revenue: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    const revenue = (jobsForRevenueTime || []).reduce((sum, j) => {
      const t = new Date(j.delivered_at!).getTime();
      if (t >= weekStart.getTime() && t < weekEnd.getTime())
        return sum + Math.round(Number(j.total_price || 0));
      return sum;
    }, 0);
    revenueByWeek.push({ week: weekLabel, revenue });
  }

  // Turnaround trend: avg turnaround days (integer) per week of delivery
  const deliveredJobs = jobsForTurnaround.data || [];
  const turnaroundByWeek: { week: string; avgDays: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    const inWeek = deliveredJobs.filter((j) => {
      const t = new Date(j.delivered_at!).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    });
    const days = inWeek.map((j) => (new Date(j.delivered_at!).getTime() - new Date(j.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const avgDays = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
    turnaroundByWeek.push({ week: weekLabel, avgDays });
  }

  const { data: allJobsForRealtors } = await admin.from("jobs").select("realtor_id").not("realtor_id", "is", null);
  const realtorCounts: Record<string, number> = {};
  (allJobsForRealtors || []).forEach((j) => {
    const id = j.realtor_id as string;
    realtorCounts[id] = (realtorCounts[id] || 0) + 1;
  });
  const topRealtorIds = Object.entries(realtorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const { data: topRealtorsData } = topRealtorIds.length
    ? await admin.from("realtors").select("id, name").in("id", topRealtorIds)
    : { data: [] };
  const realtorNameMap = Object.fromEntries((topRealtorsData || []).map((r) => [r.id, r.name]));
  const topRealtorsByVolume = topRealtorIds.map((id) => ({ realtor_id: id, name: realtorNameMap[id] ?? "Unknown", count: realtorCounts[id] }));

  const summary = {
    total_active_jobs: activeCount ?? 0,
    total_delivered_jobs: deliveredCount ?? 0,
    delivered_this_week: deliveredThisWeekCount ?? 0,
    total_overdue_jobs: overdueCount,
    total_revision_requests: revisionsCount ?? 0,
    average_turnaround_days: avgTurnaround != null ? Math.round(avgTurnaround) : null,
    total_revenue: Math.round(totalRevenue),
    revenue_by_source: revenueBySource,
    website_bookings_this_week: websiteThisWeek ?? 0,
    admin_created_jobs_this_week: adminThisWeek ?? 0,
    jobs_by_status: jobsByStatus,
    bookings_by_week: bookingsByWeek,
    revenue_by_week: revenueByWeek,
    turnaround_by_week: turnaroundByWeek,
    top_realtors_by_volume: topRealtorsByVolume,
  };

  return (
    <main className="min-h-screen bg-stone-50/80 pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-stone-500 hover:text-stone-700 transition">
          ← Admin
        </Link>
        <header className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Operational overview and key metrics for jobs, revenue, and delivery performance.
          </p>
        </header>
        <AdminAnalytics summary={summary} reportingPeriodLabel="Last 7 days · All jobs" />
      </div>
    </main>
  );
}
