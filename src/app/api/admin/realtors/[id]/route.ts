import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { slug, name, brokerage, phone, email, headshot_url, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin } = body as Record<string, unknown>;

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (typeof slug === "string") updates.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (typeof name === "string") updates.name = name.trim();
  if (brokerage !== undefined) updates.brokerage = brokerage === "" || brokerage == null ? null : String(brokerage).trim();
  if (phone !== undefined) updates.phone = phone === "" || phone == null ? null : String(phone).trim();
  if (email !== undefined) updates.email = email === "" || email == null ? null : String(email).trim();
  if (headshot_url !== undefined) updates.headshot_url = headshot_url === "" || headshot_url == null ? null : String(headshot_url).trim();
  if (title !== undefined) updates.title = title === "" || title == null ? null : String(title).trim();
  if (website !== undefined) updates.website = website === "" || website == null ? null : String(website).trim();
  if (brokerage_logo_url !== undefined) updates.brokerage_logo_url = brokerage_logo_url === "" || brokerage_logo_url == null ? null : String(brokerage_logo_url).trim();
  if (tagline !== undefined) updates.tagline = tagline === "" || tagline == null ? null : String(tagline).trim();
  if (instagram !== undefined) updates.instagram = instagram === "" || instagram == null ? null : String(instagram).trim();
  if (facebook !== undefined) updates.facebook = facebook === "" || facebook == null ? null : String(facebook).trim();
  if (linkedin !== undefined) updates.linkedin = linkedin === "" || linkedin == null ? null : String(linkedin).trim();

  const { error } = await admin.from("realtors").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
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
  const { data: existing } = await admin.from("realtors").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  const { error } = await admin.from("realtors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
