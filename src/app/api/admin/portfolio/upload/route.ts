import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getR2Config, uploadToR2 } from "@/lib/r2/client";
import { parseStudioPortfolioCategory } from "@/lib/portfolioCategories";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!getR2Config().configured) {
    return NextResponse.json(
      {
        error:
          "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const folderLabelRaw = formData.get("folder_label");
  const folderLabel = parseStudioPortfolioCategory(
    typeof folderLabelRaw === "string" ? folderLabelRaw : null
  );

  const admin = createAdminClient();

  const { count } = await admin.from("portfolio_items").select("id", { count: "exact", head: true });
  let sortOrder = count ?? 0;

  const inserted: { id: string; name: string }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!file.name || !/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(file.name)) {
      if (file.name) errors.push(`${file.name}: use JPG, PNG, WebP, GIF, or HEIC`);
      continue;
    }

    const ext = file.name.split(".").pop() || "jpg";
    // Store under portfolio/{drone|interior|...}/ so R2 path matches the section (filters + orphan listing).
    const key = `portfolio/${folderLabel}/${crypto.randomUUID()}.${ext}`;

    const buf = await file.arrayBuffer();
    const contentType =
      file.type ||
      (/\.heic$/i.test(file.name)
        ? "image/heic"
        : /\.heif$/i.test(file.name)
          ? "image/heif"
          : "image/jpeg");

    try {
      await uploadToR2(key, Buffer.from(buf), contentType);
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`);
      continue;
    }

    const { data: row, error: insertError } = await admin
      .from("portfolio_items")
      .insert({
        drive_file_id: key,
        name: file.name,
        folder_label: folderLabel,
        sort_order: sortOrder++,
      })
      .select("id, name")
      .single();

    if (insertError) {
      errors.push(`${file.name}: ${insertError.message}`);
      continue;
    }
    if (row) inserted.push(row);
  }

  if (inserted.length === 0 && files.length > 0) {
    return NextResponse.json(
      {
        uploaded: 0,
        errors,
        error:
          errors[0] ??
          "No images were saved. Check R2 credentials and that the bucket allows uploads.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ uploaded: inserted.length, errors: errors.length ? errors : undefined });
}
