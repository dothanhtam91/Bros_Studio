import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromR2, getR2Config } from "@/lib/r2";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id: albumId, imageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from("album_images")
    .select("id, storage_key")
    .eq("id", imageId)
    .eq("album_id", albumId)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (row.storage_key) {
    const { configured } = getR2Config();
    if (configured) {
      try {
        await deleteFromR2(row.storage_key);
      } catch (e) {
        console.error("R2 delete error:", e);
        // still delete DB row so UI is consistent
      }
    }
  }

  const { error: deleteErr } = await admin.from("album_images").delete().eq("id", imageId).eq("album_id", albumId);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
