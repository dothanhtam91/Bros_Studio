import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromR2, getR2Config } from "@/lib/r2";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { cover_image_id, video_url } = body as { cover_image_id?: string | null; video_url?: string | null };

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (cover_image_id !== undefined) updates.cover_image_id = cover_image_id || null;
  if (video_url !== undefined) updates.video_url = video_url === "" || video_url == null ? null : String(video_url).trim();

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });
  const { error } = await admin
    .from("albums")
    .update(updates)
    .eq("id", albumId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: album } = await admin.from("albums").select("id, realtor_id").eq("id", albumId).single();
  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  const { data: images } = await admin
    .from("album_images")
    .select("id, storage_key")
    .eq("album_id", albumId);

  const { configured } = getR2Config();
  if (configured && images?.length) {
    for (const row of images) {
      if (row.storage_key) {
        try {
          await deleteFromR2(row.storage_key);
        } catch (e) {
          console.error("R2 delete error for", row.storage_key, e);
        }
      }
    }
  }

  const { error } = await admin.from("albums").delete().eq("id", albumId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, realtor_id: album.realtor_id });
}
