import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: assets } = await admin
    .from("assets")
    .select("id, storage_key")
    .eq("project_id", projectId)
    .eq("type", "photo")
    .eq("variant", "original");

  if (!assets?.length) return NextResponse.json({ error: "No original photos" }, { status: 400 });

  const MLS_LONG_EDGE = 2048;
  const WEB_LONG_EDGE = 1600;

  for (const asset of assets) {
    try {
      const { data: fileData } = await admin.storage.from("assets").download(asset.storage_key);
      if (!fileData) continue;

      const buf = Buffer.from(await fileData.arrayBuffer());
      const meta = await sharp(buf).metadata();
      const isLandscape = (meta.width || 0) >= (meta.height || 0);

      const mlsBuf = await sharp(buf)
        .resize(isLandscape ? MLS_LONG_EDGE : null, isLandscape ? null : MLS_LONG_EDGE, { fit: "inside" })
        .sharpen()
        .toFormat("jpeg", { quality: 90 })
        .toBuffer();

      const webBuf = await sharp(buf)
        .resize(isLandscape ? WEB_LONG_EDGE : null, isLandscape ? null : WEB_LONG_EDGE, { fit: "inside" })
        .toFormat("jpeg", { quality: 85 })
        .toBuffer();

      const baseKey = asset.storage_key.replace(/\.[^.]+$/, "");
      const mlsKey = `${baseKey}_mls.jpg`;
      const webKey = `${baseKey}_web.jpg`;

      await admin.storage.from("assets").upload(mlsKey, mlsBuf, { contentType: "image/jpeg", upsert: true });
      await admin.storage.from("assets").upload(webKey, webBuf, { contentType: "image/jpeg", upsert: true });

      const mlsMeta = await sharp(mlsBuf).metadata();
      await admin.from("assets").insert([
        {
          project_id: projectId,
          type: "photo",
          variant: "mls",
          storage_key: mlsKey,
          size_bytes: mlsBuf.length,
          width: mlsMeta.width,
          height: mlsMeta.height,
          sort_order: 0,
          processing_status: "done",
        },
        {
          project_id: projectId,
          type: "photo",
          variant: "web",
          storage_key: webKey,
          size_bytes: webBuf.length,
          width: (await sharp(webBuf).metadata()).width,
          height: (await sharp(webBuf).metadata()).height,
          sort_order: 0,
          processing_status: "done",
        },
      ]);
    } catch (e) {
      console.error("Process asset error:", asset.id, e);
    }
  }

  return NextResponse.json({ ok: true });
}
