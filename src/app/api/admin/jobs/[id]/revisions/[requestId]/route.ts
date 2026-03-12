import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: jobId, requestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { status } = body as { status?: string };
  if (!status || !["open", "in_progress", "resolved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Valid status required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = { status };
  if (status === "resolved" || status === "dismissed") {
    updates.resolved_at = new Date().toISOString();
    updates.resolved_by = user.id;
  }

  const { data, error } = await admin
    .from("revision_requests")
    .update(updates)
    .eq("id", requestId)
    .eq("job_id", jobId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("job_timeline_events").insert({
    job_id: jobId,
    event_type: "revision_resolved",
    message: `Revision request ${requestId.slice(0, 8)}… marked as ${status}`,
    metadata: { revision_request_id: requestId },
  });

  return NextResponse.json(data);
}
