import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("id").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const inserted: { id: string; storage_key: string }[] = [];

  const { count } = await admin.from("assets").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  let sortOrder = count ?? 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop() || "jpg";
    const isVideo = file.type.startsWith("video/");
    const type = isVideo ? "video" : "photo";
    const key = `projects/${projectId}/${crypto.randomUUID()}.${ext}`;

    const { data: bucket } = await admin.storage.from("assets").list("");
    if (bucket?.length === undefined) {
      try {
        await admin.storage.createBucket("assets", { public: false });
      } catch {
        // bucket may exist
      }
    }

    const buf = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage.from("assets").upload(key, buf, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    const { data: asset } = await admin
      .from("assets")
      .insert({
        project_id: projectId,
        type,
        variant: "original",
        storage_key: key,
        size_bytes: file.size,
        sort_order: sortOrder++,
      })
      .select("id, storage_key")
      .single();

    if (asset) inserted.push(asset);
  }

  return NextResponse.json({ uploaded: inserted.length });
}
