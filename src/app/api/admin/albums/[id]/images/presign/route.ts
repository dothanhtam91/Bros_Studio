import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getR2Config, getPresignedUploadUrl, getR2PublicUrl } from "@/lib/r2";

const ALLOWED_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

/**
 * POST: Get presigned URLs for direct upload to R2 (bypasses Vercel 4.5 MB body limit).
 * Body: { files: { name: string; type?: string }[] }
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

  const { configured } = getR2Config();
  if (!configured) {
    return NextResponse.json(
      { error: "R2 storage not configured." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const files = (body.files as { name: string; type?: string }[]) || [];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const uploads: { key: string; url: string; contentType: string }[] = [];
  for (const f of files) {
    if (!f.name || !ALLOWED_EXT.test(f.name)) continue;
    const ext = f.name.split(".").pop() || "jpg";
    const contentType = f.type || "image/jpeg";
    const key = `albums/${albumId}/${crypto.randomUUID()}.${ext}`;
    const url = await getPresignedUploadUrl(key, contentType);
    uploads.push({ key, url, contentType });
  }

  if (uploads.length === 0) {
    return NextResponse.json({ error: "No valid image files" }, { status: 400 });
  }

  return NextResponse.json({ uploads });
}
