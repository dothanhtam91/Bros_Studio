import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("revision_requests")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ revision_requests: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { type, message, realtor_id, customer_id } = body as {
    type: string;
    message?: string | null;
    realtor_id?: string | null;
    customer_id?: string | null;
  };

  if (!type?.trim()) return NextResponse.json({ error: "Type is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("id, realtor_id, customer_id").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { data: rev, error } = await admin
    .from("revision_requests")
    .insert({
      job_id: jobId,
      realtor_id: realtor_id ?? job.realtor_id,
      customer_id: customer_id ?? job.customer_id,
      type: type.trim(),
      message: message?.trim() || null,
      status: "open",
    })
    .select("id, type, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("job_timeline_events").insert({
    job_id: jobId,
    event_type: "revision_requested",
    message: `Revision request: ${type.replace(/_/g, " ")}`,
    metadata: { revision_request_id: rev.id },
  });

  await admin.from("jobs").update({ status: "revision_requested" }).eq("id", jobId);
  await admin.from("notifications").insert({
    job_id: jobId,
    realtor_id: job.realtor_id,
    customer_id: job.customer_id,
    type: "revision_request_submitted",
    title: "Revision request submitted",
    message: `Job ${jobId.slice(0, 8)}…: ${type.replace(/_/g, " ")}`,
  });

  return NextResponse.json(rev);
}
