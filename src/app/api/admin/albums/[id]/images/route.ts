import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToR2, getR2Config } from "@/lib/r2";

const ALLOWED_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { configured } = getR2Config();
  if (!configured) {
    return NextResponse.json(
      { error: "R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL in .env.local." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const admin = createAdminClient();

  const { count } = await admin
    .from("album_images")
    .select("id", { count: "exact", head: true })
    .eq("album_id", albumId);
  let sortOrder = (count ?? 0) as number;

  const inserted: { id: string }[] = [];
  let firstError: string | null = null;

  for (const file of files) {
    if (!file.name || !ALLOWED_EXT.test(file.name)) continue;

    const ext = file.name.split(".").pop() || "jpg";
    const key = `albums/${albumId}/${crypto.randomUUID()}.${ext}`;

    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const contentType = file.type || "image/jpeg";
      const imageUrl = await uploadToR2(key, buf, contentType);

      const { data: row, error: insertError } = await admin
        .from("album_images")
        .insert({
          album_id: albumId,
          image_url: imageUrl,
          storage_key: key,
          sort_order: sortOrder++,
        })
        .select("id")
        .single();

      if (!insertError && row) inserted.push(row);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      if (!firstError) firstError = msg;
    }
  }

  if (inserted.length === 0 && firstError) {
    return NextResponse.json({ error: `Upload failed: ${firstError}` }, { status: 500 });
  }
  if (inserted.length === 0 && files.length > 0) {
    return NextResponse.json(
      { error: "No valid images. Use .jpg, .jpeg, .png, .webp, or .gif files." },
      { status: 400 }
    );
  }

  return NextResponse.json({ uploaded: inserted.length });
}
