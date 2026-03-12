import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { approved, requested_changes } = body;
  if (typeof approved !== "boolean") {
    return NextResponse.json({ error: "approved is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("id").eq("user_id", user.id).single();
  if (!client) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("client_id", client.id)
    .single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await admin.from("reviews_approvals").insert({
    project_id: projectId,
    approved,
    requested_changes: requested_changes || null,
    reviewed_by: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
