import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getR2PublicUrl } from "@/lib/r2";

/**
 * POST: Confirm uploaded images (insert into album_images).
 * Body: { keys: string[] } — R2 keys for files already uploaded via presigned URL.
 */
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

  const body = await request.json().catch(() => ({}));
  const keys = (body.keys as string[]) || [];
  if (!keys.length) return NextResponse.json({ error: "No keys" }, { status: 400 });

  const admin = createAdminClient();
  const { count } = await admin
    .from("album_images")
    .select("id", { count: "exact", head: true })
    .eq("album_id", albumId);
  let sortOrder = (count ?? 0) as number;

  const inserted: { id: string }[] = [];
  for (const key of keys) {
    if (!key.startsWith(`albums/${albumId}/`)) continue;
    const imageUrl = getR2PublicUrl(key);
    const { data: row, error } = await admin
      .from("album_images")
      .insert({
        album_id: albumId,
        image_url: imageUrl,
        storage_key: key,
        sort_order: sortOrder++,
      })
      .select("id")
      .single();
    if (!error && row) inserted.push(row);
  }

  return NextResponse.json({ uploaded: inserted.length });
}
