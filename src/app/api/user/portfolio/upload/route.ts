import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const admin = createAdminClient();
  const bucket = "portfolio";

  const { error: bucketErr } = await admin.storage.getBucket(bucket);
  if (bucketErr) {
    const { error: createErr } = await admin.storage.createBucket(bucket, { public: true });
    if (createErr) {
      return NextResponse.json(
        { error: `Could not create storage bucket: ${createErr.message}. Create a "portfolio" bucket in Supabase Dashboard → Storage.` },
        { status: 500 }
      );
    }
  }

  const prefix = `user/${user.id}`;
  const { count } = await admin
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  let sortOrder = (count ?? 0) as number;

  const inserted: { id: string; name: string }[] = [];

  for (const file of files) {
    if (!file.name || !/\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) continue;

    const ext = file.name.split(".").pop() || "jpg";
    const key = `${prefix}/${crypto.randomUUID()}.${ext}`;

    const buf = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage.from(bucket).upload(key, buf, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) continue;

    const { data: row, error: insertError } = await admin
      .from("portfolio_items")
      .insert({
        drive_file_id: key,
        name: file.name,
        folder_label: "My portfolio",
        sort_order: sortOrder++,
        user_id: user.id,
      })
      .select("id, name")
      .single();

    if (!insertError && row) inserted.push(row);
  }

  return NextResponse.json({ uploaded: inserted.length });
}
