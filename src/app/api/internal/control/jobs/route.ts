import { NextResponse } from "next/server";
import { JOB_SOURCES, JOB_STATUSES } from "@/lib/jobs";
import {
  getInternalControlAdminClient,
  parsePositiveInt,
  requireInternalControl,
} from "@/lib/internal-control";

const JOB_SORTS = new Set(["newest", "oldest", "deadline", "updated"]);

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const source = url.searchParams.get("source")?.trim() || null;
  const status = url.searchParams.get("status")?.trim() || null;
  const realtorId = url.searchParams.get("realtor_id")?.trim() || null;
  const limit = parsePositiveInt(url.searchParams.get("limit"), 20, 100);
  const page = parsePositiveInt(url.searchParams.get("page"), 1, 1000);
  const sort = url.searchParams.get("sort")?.trim() || "newest";
  const offset = (page - 1) * limit;

  if (source && !JOB_SOURCES.includes(source as (typeof JOB_SOURCES)[number])) {
    return NextResponse.json({ error: "Invalid source filter", allowed: JOB_SOURCES }, { status: 400 });
  }

  if (status && !JOB_STATUSES.includes(status as (typeof JOB_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status filter", allowed: JOB_STATUSES }, { status: 400 });
  }

  if (!JOB_SORTS.has(sort)) {
    return NextResponse.json({ error: "Invalid sort", allowed: [...JOB_SORTS] }, { status: 400 });
  }

  const admin = getInternalControlAdminClient();
  let query = admin
    .from("jobs")
    .select(
      "id, source, realtor_id, customer_id, album_id, property_address, listing_title, service_type, shooting_date, delivery_deadline, delivered_at, total_price, priority, status, notes, assigned_photographer_id, assigned_editor_id, created_at, updated_at",
      { count: "exact" }
    );

  if (source) query = query.eq("source", source);
  if (status) query = query.eq("status", status);
  if (realtorId) query = query.eq("realtor_id", realtorId);

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "deadline") query = query.order("delivery_deadline", { ascending: true, nullsFirst: false });
  else if (sort === "updated") query = query.order("updated_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: rows, error, count } = await query.range(offset, offset + limit - 1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const realtorIds = [...new Set((rows ?? []).map((row) => row.realtor_id).filter(Boolean))] as string[];
  const customerIds = [...new Set((rows ?? []).map((row) => row.customer_id).filter(Boolean))] as string[];

  const [realtorsRes, customersRes] = await Promise.all([
    realtorIds.length
      ? admin.from("realtors").select("id, slug, name, email, brokerage").in("id", realtorIds)
      : Promise.resolve({ data: [], error: null }),
    customerIds.length
      ? admin.from("customers").select("id, name, email, phone, company").in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (realtorsRes.error || customersRes.error) {
    return NextResponse.json(
      { error: realtorsRes.error?.message ?? customersRes.error?.message ?? "Failed to load job relations" },
      { status: 500 }
    );
  }

  const realtorMap = Object.fromEntries((realtorsRes.data ?? []).map((row) => [row.id, row]));
  const customerMap = Object.fromEntries((customersRes.data ?? []).map((row) => [row.id, row]));

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    page,
    limit,
    total: count ?? 0,
    jobs: (rows ?? []).map((row) => ({
      ...row,
      realtor: row.realtor_id ? realtorMap[row.realtor_id] ?? null : null,
      customer: row.customer_id ? customerMap[row.customer_id] ?? null : null,
    })),
  });
}
