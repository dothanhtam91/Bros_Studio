import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import slugifyAddress from "@/lib/slugify";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { realtor_id, address, shoot_date } = body as {
    realtor_id: string;
    address: string;
    shoot_date?: string | null;
  };

  if (!realtor_id?.trim() || !address?.trim()) {
    return NextResponse.json({ error: "Realtor and address required" }, { status: 400 });
  }

  let slug = slugifyAddress(address);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("albums")
    .select("slug")
    .eq("realtor_id", realtor_id)
    .eq("slug", slug);

  if (existing?.length) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const { data: row, error } = await admin
    .from("albums")
    .insert({
      realtor_id,
      slug,
      address: address.trim(),
      shoot_date: shoot_date || null,
    })
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: row.id, slug: row.slug });
}
