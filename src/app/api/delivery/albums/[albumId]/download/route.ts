import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import archiver from "archiver";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids"); // comma-separated image ids (optional)
  const imageIds = idsParam ? idsParam.split(",").map((id) => id.trim()).filter(Boolean) : null;

  const admin = createAdminClient();
  let q = admin
    .from("album_images")
    .select("id, image_url, sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true });
  if (imageIds?.length) q = q.in("id", imageIds);
  const { data: images } = await q;

  if (!images?.length) {
    return NextResponse.json({ error: "No images found" }, { status: 404 });
  }

  const { data: album } = await admin.from("albums").select("address").eq("id", albumId).single();
  const slug = (album?.address ?? "album").replace(/[^a-z0-9]+/gi, "-").slice(0, 40) || "album";

  const results = await Promise.all(
    images.map(async (img, i) => {
      try {
        const res = await fetch(img.image_url, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = img.image_url.split(".").pop()?.toLowerCase() || "jpg";
        const name = /^(jpg|jpeg|png|webp|gif)$/.test(ext)
          ? `image-${String(i + 1).padStart(2, "0")}.${ext}`
          : `image-${i + 1}.jpg`;
        return { name, buf };
      } catch {
        return null;
      }
    })
  );
  const buffers = results.filter((r) => r !== null) as { name: string; buf: Buffer }[];

  if (buffers.length === 0) {
    return NextResponse.json({ error: "Could not fetch images" }, { status: 502 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.on("data", (chunk) => controller.enqueue(chunk));
      archive.on("end", () => controller.close());
      archive.on("error", (err) => controller.error(err));
      buffers.forEach(({ name, buf }) => archive.append(buf, { name }));
      archive.finalize();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
    },
  });
}
