import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateAlbumForJob } from "@/lib/jobs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const realtorId = searchParams.get("realtor_id");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
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
    realtorIds.length
      ? admin.from("realtors").select("id, name, email").in("id", realtorIds)
      : Promise.resolve({ data: [] }),
    customerIds.length
      ? admin.from("customers").select("id, name, email").in("id", customerIds)
      : Promise.resolve({ data: [] }),
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const {
    realtor_id,
    property_address,
    listing_title,
    service_type,
    shooting_date,
    delivery_deadline,
    total_price,
    priority,
    status,
    notes,
    assigned_photographer_id,
    assigned_editor_id,
  } = body as {
    realtor_id: string;
    property_address: string;
    listing_title?: string | null;
    service_type?: string | null;
    shooting_date?: string | null;
    delivery_deadline?: string | null;
    total_price?: number | null;
    priority?: string | null;
    status?: string | null;
    notes?: string | null;
    assigned_photographer_id?: string | null;
    assigned_editor_id?: string | null;
  };

  if (!realtor_id?.trim() || !property_address?.trim()) {
    return NextResponse.json({ error: "Realtor and property address required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: realtor } = await admin.from("realtors").select("id").eq("id", realtor_id).single();
  if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  let albumId: string;
  try {
    const album = await findOrCreateAlbumForJob(
      admin,
      realtor_id,
      property_address,
      shooting_date || null
    );
    albumId = album.id;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create album" }, { status: 500 });
  }

  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      source: "admin_created",
      realtor_id: realtor_id,
      customer_id: null,
      album_id: albumId,
      property_address: property_address.trim(),
      listing_title: listing_title?.trim() || null,
      service_type: service_type?.trim() || null,
      shooting_date: shooting_date || null,
      delivery_deadline: delivery_deadline || null,
      total_price: total_price != null ? Number(total_price) : null,
      priority: priority?.trim() || "normal",
      status: status?.trim() || "new_booking",
      notes: notes?.trim() || null,
      assigned_photographer_id: assigned_photographer_id || null,
      assigned_editor_id: assigned_editor_id || null,
    })
    .select("id, album_id, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("job_timeline_events").insert({
    job_id: job.id,
    event_type: "job_created",
    message: "Job created by admin",
    metadata: {},
  });

  await admin.from("albums").update({ job_id: job.id }).eq("id", albumId);

  return NextResponse.json({
    id: job.id,
    album_id: job.album_id,
    status: job.status,
    created_at: job.created_at,
  });
}
