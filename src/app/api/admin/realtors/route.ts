import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { slug, name, brokerage, phone, email } = body as {
    slug: string;
    name: string;
    brokerage?: string | null;
    phone?: string | null;
    email?: string | null;
  };

  if (!slug?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Slug and name required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("realtors")
    .insert({
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
      name: name.trim(),
      brokerage: brokerage?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: row.id });
}
