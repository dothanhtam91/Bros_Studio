import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToR2, getR2Config } from "@/lib/r2";

const ALLOWED_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!realtor) {
    return NextResponse.json({ error: "Realtor profile not linked to this account" }, { status: 403 });
  }

  const { configured } = getR2Config();
  if (!configured) {
    return NextResponse.json(
      { error: "R2 storage not configured. Set R2_* env vars." },
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
  const key = `realtors/${realtor.id}/headshot.${ext}`;

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";
    const headshotUrl = await uploadToR2(key, buf, contentType);

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("realtors")
      .update({ headshot_url: headshotUrl })
      .eq("id", realtor.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ headshot_url: headshotUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
