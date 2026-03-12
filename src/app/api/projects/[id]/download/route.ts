import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import archiver from "archiver";

async function getProjectAndAssets(
  projectId: string,
  userId: string,
  assetIds?: string[]
) {
  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("id").eq("user_id", userId).single();
  if (!client) return { error: "Forbidden" as const, data: null };
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("client_id", client.id)
    .single();
  if (!project) return { error: "Not found" as const, data: null };
  const { data: invoices } = await admin.from("invoices").select("id").eq("project_id", projectId).or("status.eq.paid,paid_at.not.is.null");
  const paid = invoices && invoices.length > 0;
  if (!paid) return { error: "Payment required" as const, data: null };
  let q = admin.from("assets").select("id, storage_key, mls_filename, sort_order").eq("project_id", projectId).eq("type", "photo");
  if (assetIds?.length) q = q.in("id", assetIds);
  const { data: assets } = await q.order("sort_order");
  if (!assets?.length) return { error: "No assets" as const, data: null };
  return { error: null, data: { projectId, userId, assets } };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const out = await getProjectAndAssets(projectId, user.id);
  if (out.error) {
    const status = out.error === "Forbidden" ? 403 : out.error === "Not found" ? 404 : out.error === "Payment required" ? 403 : 400;
    return NextResponse.json({ error: out.error }, { status });
  }
  const { projectId: pid, userId, assets } = out.data!;
  await createAdminClient().from("downloads").insert({ project_id: pid, user_id: userId, asset_id: null });
  const stream = new ReadableStream({
    start(controller) {
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("data", (chunk) => controller.enqueue(chunk));
      archive.on("end", () => controller.close());
      archive.on("error", (err) => controller.error(err));
      assets.forEach((a, i) => {
        archive.append(Buffer.from(""), { name: a.mls_filename || `photo_${i + 1}.jpg` });
      });
      archive.finalize();
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="BrosStudio-${pid}.zip"`,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const assetIds = (body.assetIds as string[]) || [];

  const out = await getProjectAndAssets(projectId, user.id, assetIds.length ? assetIds : undefined);
  if (out.error) {
    const status = out.error === "Forbidden" ? 403 : out.error === "Not found" ? 404 : out.error === "Payment required" ? 403 : 400;
    return NextResponse.json({ error: out.error }, { status });
  }
  const { projectId: pid, userId, assets } = out.data!;

  await createAdminClient().from("downloads").insert({
    project_id: pid,
    user_id: userId,
    asset_id: null,
  });

  // For MVP: return a ZIP with placeholder or use Supabase Storage signed URLs and stream
  // Here we stream a minimal ZIP (no actual file bytes without storage)
  const stream = new ReadableStream({
    start(controller) {
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("data", (chunk) => controller.enqueue(chunk));
      archive.on("end", () => controller.close());
      archive.on("error", (err) => controller.error(err));
      assets.forEach((a, i) => {
        const name = a.mls_filename || `photo_${i + 1}.jpg`;
        archive.append(Buffer.from(""), { name });
      });
      archive.finalize();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="BrosStudio-selected.zip"`,
    },
  });
}
