import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToR2, getR2Config } from "@/lib/r2";

const ALLOWED_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: realtorId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { configured } = getR2Config();
  if (!configured) {
    return NextResponse.json(
      { error: "R2 storage not configured. Set R2_* env vars in .env.local." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file?.name || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_EXT.test(file.name)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF image" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = `realtors/${realtorId}/headshot.${ext}`;

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";
    const headshotUrl = await uploadToR2(key, buf, contentType);

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("realtors")
      .update({ headshot_url: headshotUrl })
      .eq("id", realtorId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ headshot_url: headshotUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
