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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("id").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const amount_cents = Number(body.amount_cents);
  if (!Number.isFinite(amount_cents) || amount_cents < 0) {
    return NextResponse.json({ error: "amount_cents required" }, { status: 400 });
  }

  const { data: invoice, error } = await admin
    .from("invoices")
    .insert({
      project_id: projectId,
      status: "open",
      amount_cents,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: invoice.id });
}
