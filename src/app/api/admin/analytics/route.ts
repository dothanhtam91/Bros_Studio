import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const summaryOnly = searchParams.get("summary") === "1";

  const admin = createAdminClient();

  if (summaryOnly) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString();

    const [
      { count: activeCount },
      { count: deliveredCount },
      { data: overdueData },
      { count: revisionsCount },
      jobsForTurnaround,
      jobsForRevenue,
      { count: websiteThisWeek },
      { count: adminThisWeek },
    ] = await Promise.all([
      admin.from("jobs").select("id", { count: "exact", head: true }).in("status", ["new_booking", "pending_confirmation", "scheduled", "shooting", "editing", "review", "revision_requested"]),
      admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      admin.from("jobs").select("id, status").lt("delivery_deadline", now.toISOString().slice(0, 10)),
      admin.from("revision_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
      admin.from("jobs").select("delivered_at, created_at").not("delivered_at", "is", null),
      admin.from("jobs").select("total_price, source").not("total_price", "is", null),
      admin.from("jobs").select("id", { count: "exact", head: true }).eq("source", "website_booking").gte("created_at", weekStartStr),
      admin.from("jobs").select("id", { count: "exact", head: true }).eq("source", "admin_created").gte("created_at", weekStartStr),
    ]);

    const completedStatuses = ["completed", "cancelled", "delivered"];
    const overdueCount = (overdueData || []).filter(
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

    return NextResponse.json({
      total_active_jobs: activeCount ?? 0,
      total_delivered_jobs: deliveredCount ?? 0,
      total_overdue_jobs: overdueCount,
      total_revision_requests: revisionsCount ?? 0,
      average_turnaround_days: avgTurnaround != null ? Math.round(avgTurnaround * 10) / 10 : null,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      revenue_by_source: revenueBySource,
      website_bookings_this_week: websiteThisWeek ?? 0,
      admin_created_jobs_this_week: adminThisWeek ?? 0,
    });
  }

  const source = searchParams.get("source");
  const realtorId = searchParams.get("realtor_id");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = (page - 1) * limit;

  let q = admin
    .from("jobs")
    .select(
      "id, source, realtor_id, customer_id, album_id, property_address, listing_title, service_type, shooting_date, delivery_deadline, delivered_at, total_price, priority, status, created_at, updated_at",
      { count: "exact" }
    );

  if (source) q = q.eq("source", source);
  if (realtorId) q = q.eq("realtor_id", realtorId);
  if (status) q = q.eq("status", status);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  if (sort === "oldest") q = q.order("created_at", { ascending: true });
  else if (sort === "price_asc") q = q.order("total_price", { ascending: true, nullsFirst: false });
  else if (sort === "price_desc") q = q.order("total_price", { ascending: false, nullsFirst: true });
  else if (sort === "deadline") q = q.order("delivery_deadline", { ascending: true, nullsFirst: true });
  else q = q.order("created_at", { ascending: false });

  const { data: rows, error, count } = await q.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const realtorIds = [...new Set((rows || []).map((r) => r.realtor_id).filter(Boolean))] as string[];
  const customerIds = [...new Set((rows || []).map((r) => r.customer_id).filter(Boolean))] as string[];

  const [realtorsRes, customersRes] = await Promise.all([
    realtorIds.length ? admin.from("realtors").select("id, name, email").in("id", realtorIds) : Promise.resolve({ data: [] }),
    customerIds.length ? admin.from("customers").select("id, name, email").in("id", customerIds) : Promise.resolve({ data: [] }),
  ]);

  const realtorMap = Object.fromEntries((realtorsRes.data || []).map((r) => [r.id, r]));
  const customerMap = Object.fromEntries((customersRes.data || []).map((c) => [c.id, c]));

  const jobs = (rows || []).map((j) => ({
    ...j,
    realtor: j.realtor_id ? realtorMap[j.realtor_id] : null,
    customer: j.customer_id ? customerMap[j.customer_id] : null,
  }));

  return NextResponse.json({ jobs, total: count ?? 0 });
}
