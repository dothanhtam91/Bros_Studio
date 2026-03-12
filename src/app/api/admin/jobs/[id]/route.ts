import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const [realtorRes, customerRes, albumRes, timelineRes, revisionsRes] = await Promise.all([
    job.realtor_id ? admin.from("realtors").select("*").eq("id", job.realtor_id).single() : Promise.resolve({ data: null }),
    job.customer_id ? admin.from("customers").select("*").eq("id", job.customer_id).single() : Promise.resolve({ data: null }),
    job.album_id ? admin.from("albums").select("id, slug, address, shoot_date, realtor_id").eq("id", job.album_id).single() : Promise.resolve({ data: null }),
    admin.from("job_timeline_events").select("*").eq("job_id", id).order("created_at", { ascending: false }),
    admin.from("revision_requests").select("*").eq("job_id", id).order("created_at", { ascending: false }),
  ]);

  const realtor = realtorRes.data;
  const album = albumRes.data;
  let realtorSlug: string | null = null;
  if (album?.realtor_id) {
    const { data: r } = await admin.from("realtors").select("slug").eq("id", album.realtor_id).single();
    realtorSlug = r?.slug ?? null;
  }

  return NextResponse.json({
    job,
    realtor: realtor ?? null,
    customer: customerRes.data ?? null,
    album: album ? { ...album, realtor_slug: realtorSlug } : null,
    timeline: timelineRes.data ?? [],
    revision_requests: revisionsRes.data ?? [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const admin = createAdminClient();

  const { data: existing } = await admin.from("jobs").select("id, status").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  const allowed = [
    "status", "property_address", "listing_title", "service_type", "shooting_date",
    "delivery_deadline", "total_price", "priority", "notes",
    "assigned_photographer_id", "assigned_editor_id", "delivered_at",
    "confirmed_at", "scheduled_at", "shooting_started_at", "shooting_completed_at",
    "editing_started_at", "review_started_at", "completed_at", "cancelled_at",
  ] as const;
  for (const key of allowed) {
    if (key in body) {
      const v = body[key];
      if (v === undefined) continue;
      if (key === "delivered_at" || key === "confirmed_at" || key === "scheduled_at" ||
          key === "shooting_started_at" || key === "shooting_completed_at" ||
          key === "editing_started_at" || key === "review_started_at" ||
          key === "completed_at" || key === "cancelled_at") {
        updates[key] = v === "" || v == null ? null : v;
      } else if (key === "total_price") {
        updates[key] = v === "" || v == null ? null : Number(v);
      } else {
        updates[key] = v === "" || v == null ? null : v;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  if (updates.status && updates.status !== existing.status) {
    await admin.from("job_timeline_events").insert({
      job_id: id,
      event_type: "status_changed",
      message: `Status changed to ${updates.status}`,
      metadata: { from: existing.status, to: updates.status },
    });
  }

  const { error } = await admin.from("jobs").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("id").eq("id", id).single();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { error } = await admin.from("jobs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
