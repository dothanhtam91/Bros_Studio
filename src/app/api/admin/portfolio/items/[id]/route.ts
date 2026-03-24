import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isStudioPortfolioCategorySlug,
  type StudioPortfolioCategoryValue,
} from "@/lib/portfolioCategories";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw =
    typeof body === "object" &&
    body !== null &&
    "folder_label" in body &&
    typeof (body as { folder_label: unknown }).folder_label === "string"
      ? (body as { folder_label: string }).folder_label.trim().toLowerCase()
      : "";

  if (!raw) {
    return NextResponse.json({ error: "folder_label is required" }, { status: 400 });
  }
  if (!isStudioPortfolioCategorySlug(raw)) {
    return NextResponse.json({ error: "Invalid folder_label" }, { status: 400 });
  }
  const folder_label = raw as StudioPortfolioCategoryValue;

  const admin = createAdminClient();
  const { data: row, error: fetchError } = await admin
    .from("portfolio_items")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.user_id !== null) {
    return NextResponse.json(
      { error: "Only studio (public) portfolio items can be updated here" },
      { status: 403 }
    );
  }

  const { error: updateError } = await admin
    .from("portfolio_items")
    .update({ folder_label })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, folder_label });
}
