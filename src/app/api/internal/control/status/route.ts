import { NextResponse } from "next/server";
import { getInternalControlAdminClient, requireInternalControl } from "@/lib/internal-control";

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const admin = getInternalControlAdminClient();

  const [jobsRes, realtorsRes, albumsRes, portfolioRes, notificationsRes] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }),
    admin.from("realtors").select("id", { count: "exact", head: true }),
    admin.from("albums").select("id", { count: "exact", head: true }),
    admin.from("portfolio_items").select("id", { count: "exact", head: true }),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
  ]);

  const errors = [jobsRes, realtorsRes, albumsRes, portfolioRes, notificationsRes]
    .map((result) => result.error?.message)
    .filter(Boolean);

  if (errors.length > 0) {
    return NextResponse.json({ error: "Failed to load status", details: errors }, { status: 500 });
  }

  const { data: recentJobs, error: recentJobsError } = await admin
    .from("jobs")
    .select("id, source, status, property_address, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentJobsError) {
    return NextResponse.json({ error: recentJobsError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    timestamp: new Date().toISOString(),
    counts: {
      jobs: jobsRes.count ?? 0,
      realtors: realtorsRes.count ?? 0,
      albums: albumsRes.count ?? 0,
      portfolio_items: portfolioRes.count ?? 0,
      unread_notifications: notificationsRes.count ?? 0,
    },
    recent_jobs: recentJobs ?? [],
  });
}
