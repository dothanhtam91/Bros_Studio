import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedAnalyticsRange } from "./analyticsDateRange";

type AdminClient = ReturnType<typeof createAdminClient>;

const ACTIVE_STATUSES = [
  "new_booking",
  "pending_confirmation",
  "scheduled",
  "shooting",
  "editing",
  "review",
  "revision_requested",
] as const;

const TERMINAL_FOR_OVERDUE = ["delivered", "completed", "cancelled"];

function toYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Week buckets (Sun–Sun) that overlap the analytics range */
function generateWeekBuckets(rangeStart: Date, rangeEnd: Date) {
  const out: { weekStart: Date; weekEnd: Date; label: string }[] = [];
  const d = new Date(rangeStart);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());

  while (d <= rangeEnd && out.length < 53) {
    const weekStart = new Date(d);
    const weekEnd = new Date(d);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const label = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
    out.push({ weekStart, weekEnd, label });
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export type AnalyticsSummaryPayload = {
  jobs_created_in_period: number;
  in_progress_in_period: number;
  delivered_in_period: number;
  overdue_as_of_period_end: number;
  total_revision_requests_in_period: number;
  average_turnaround_days: number | null;
  total_revenue: number;
  revenue_by_source: Record<string, number>;
  website_bookings_in_period: number;
  admin_created_jobs_in_period: number;
  jobs_by_status: Record<string, number>;
  bookings_by_week: { week: string; website: number; admin: number; total: number }[];
  revenue_by_week: { week: string; revenue: number }[];
  turnaround_by_week: { week: string; avgDays: number }[];
  top_realtors_by_volume: { realtor_id: string; name: string; count: number }[];
};

/** Safe fallback when queries fail (missing tables, network, etc.). */
export function emptyAnalyticsSummary(): AnalyticsSummaryPayload {
  return {
    jobs_created_in_period: 0,
    in_progress_in_period: 0,
    delivered_in_period: 0,
    overdue_as_of_period_end: 0,
    total_revision_requests_in_period: 0,
    average_turnaround_days: null,
    total_revenue: 0,
    revenue_by_source: {},
    website_bookings_in_period: 0,
    admin_created_jobs_in_period: 0,
    jobs_by_status: {},
    bookings_by_week: [],
    revenue_by_week: [],
    turnaround_by_week: [],
    top_realtors_by_volume: [],
  };
}

export async function buildAnalyticsSummary(
  admin: AdminClient,
  range: ParsedAnalyticsRange
): Promise<AnalyticsSummaryPayload> {
  const { startISO, endISO, start, end } = range;
  const endDateStr = toYyyyMmDd(end);

  const statuses = [
    "new_booking",
    "pending_confirmation",
    "scheduled",
    "shooting",
    "editing",
    "review",
    "delivered",
    "revision_requested",
    "completed",
    "cancelled",
  ];

  const [
    { count: jobsCreatedCount },
    { count: inProgressCount },
    { count: deliveredInPeriodCount },
    { data: overdueJobsData },
    { count: revisionsInPeriod },
    { data: jobsDeliveredInPeriod },
    { data: jobsWithPriceInPeriod },
    { count: websiteInPeriod },
    { count: adminInPeriod },
  ] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", startISO).lte("created_at", endISO),
    admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .in("status", [...ACTIVE_STATUSES])
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "delivered")
      .not("delivered_at", "is", null)
      .gte("delivered_at", startISO)
      .lte("delivered_at", endISO),
    admin.from("jobs").select("id, status").lt("delivery_deadline", endDateStr),
    admin
      .from("revision_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    admin
      .from("jobs")
      .select("delivered_at, created_at")
      .not("delivered_at", "is", null)
      .gte("delivered_at", startISO)
      .lte("delivered_at", endISO),
    admin
      .from("jobs")
      .select("total_price, source")
      .not("total_price", "is", null)
      .not("delivered_at", "is", null)
      .gte("delivered_at", startISO)
      .lte("delivered_at", endISO),
    admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("source", "website_booking")
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("source", "admin_created")
      .gte("created_at", startISO)
      .lte("created_at", endISO),
  ]);

  const overdueCount = (overdueJobsData || []).filter(
    (j) => !TERMINAL_FOR_OVERDUE.includes((j as { status?: string }).status ?? "")
  ).length;

  const turnaroundTimes = (jobsDeliveredInPeriod || []).map((j) => {
    const created = new Date(j.created_at).getTime();
    const delivered = new Date(j.delivered_at!).getTime();
    return (delivered - created) / (1000 * 60 * 60 * 24);
  });
  const avgTurnaround = turnaroundTimes.length
    ? turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length
    : null;

  const totalRevenue = (jobsWithPriceInPeriod || []).reduce((sum, j) => sum + Number(j.total_price || 0), 0);
  const revenueBySource = (jobsWithPriceInPeriod || []).reduce(
    (acc, j) => {
      const s = j.source || "unknown";
      acc[s] = (acc[s] || 0) + Number(j.total_price || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const jobsByStatus: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (st) => {
      const { count } = await admin
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", st)
        .gte("created_at", startISO)
        .lte("created_at", endISO);
      jobsByStatus[st] = count ?? 0;
    })
  );

  const weekBuckets = generateWeekBuckets(start, end);

  const { data: jobsForWeeks } = await admin
    .from("jobs")
    .select("id, created_at, source")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  const bookingsByWeek = weekBuckets.map(({ weekStart, weekEnd, label }) => {
    let website = 0;
    let admin = 0;
    (jobsForWeeks || []).forEach((j) => {
      const t = new Date(j.created_at).getTime();
      if (t >= weekStart.getTime() && t < weekEnd.getTime()) {
        if (j.source === "website_booking") website++;
        else admin++;
      }
    });
    return { week: label, website, admin, total: website + admin };
  });

  const { data: jobsForRevenueTime } = await admin
    .from("jobs")
    .select("delivered_at, total_price")
    .not("delivered_at", "is", null)
    .not("total_price", "is", null)
    .gte("delivered_at", startISO)
    .lte("delivered_at", endISO);

  const revenueByWeek = weekBuckets.map(({ weekStart, weekEnd, label }) => {
    const revenue = (jobsForRevenueTime || []).reduce((sum, j) => {
      const t = new Date(j.delivered_at!).getTime();
      if (t >= weekStart.getTime() && t < weekEnd.getTime())
        return sum + Math.round(Number(j.total_price || 0));
      return sum;
    }, 0);
    return { week: label, revenue };
  });

  const deliveredJobs = jobsDeliveredInPeriod || [];
  const turnaroundByWeek = weekBuckets.map(({ weekStart, weekEnd, label }) => {
    const inWeek = deliveredJobs.filter((j) => {
      const t = new Date(j.delivered_at!).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    });
    const days = inWeek.map(
      (j) =>
        (new Date(j.delivered_at!).getTime() - new Date(j.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgDays = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
    return { week: label, avgDays };
  });

  const { data: allJobsForRealtors } = await admin
    .from("jobs")
    .select("realtor_id")
    .not("realtor_id", "is", null)
    .gte("created_at", startISO)
    .lte("created_at", endISO);

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
  const topRealtorsByVolume = topRealtorIds.map((id) => ({
    realtor_id: id,
    name: realtorNameMap[id] ?? "Unknown",
    count: realtorCounts[id]!,
  }));

  return {
    jobs_created_in_period: jobsCreatedCount ?? 0,
    in_progress_in_period: inProgressCount ?? 0,
    delivered_in_period: deliveredInPeriodCount ?? 0,
    overdue_as_of_period_end: overdueCount,
    total_revision_requests_in_period: revisionsInPeriod ?? 0,
    average_turnaround_days: avgTurnaround != null ? Math.round(avgTurnaround) : null,
    total_revenue: Math.round(totalRevenue),
    revenue_by_source: revenueBySource,
    website_bookings_in_period: websiteInPeriod ?? 0,
    admin_created_jobs_in_period: adminInPeriod ?? 0,
    jobs_by_status: jobsByStatus,
    bookings_by_week: bookingsByWeek,
    revenue_by_week: revenueByWeek,
    turnaround_by_week: turnaroundByWeek,
    top_realtors_by_volume: topRealtorsByVolume,
  };
}
