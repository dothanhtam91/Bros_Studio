import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    slug,
    name,
    brokerage,
    phone,
    email,
    headshot_url,
    title,
    website,
    brokerage_logo_url,
    tagline,
    instagram,
    facebook,
    linkedin,
  } = body as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  if (typeof slug === "string") {
    updates.slug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
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

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id, slug, user_id")
    .eq("user_id", user.id)
    .single();

  if (!realtor) {
    return NextResponse.json({ error: "Realtor profile not linked to this account" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("realtors")
    .update(updates)
    .eq("id", realtor.id)
    .eq("user_id", user.id)
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, realtor: updated });
}
