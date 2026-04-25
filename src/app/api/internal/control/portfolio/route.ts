import { NextResponse } from "next/server";
import { parsePositiveInt, getInternalControlAdminClient, requireInternalControl } from "@/lib/internal-control";

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = parsePositiveInt(url.searchParams.get("limit"), 50, 200);
  const page = parsePositiveInt(url.searchParams.get("page"), 1, 1000);
  const includeSettings = url.searchParams.get("include_settings") !== "false";
  const offset = (page - 1) * limit;

  const admin = getInternalControlAdminClient();
  const [{ data: items, error: itemsError, count }, settingsRes] = await Promise.all([
    admin
      .from("portfolio_items")
      .select("id, user_id, drive_file_id, name, folder_label, sort_order, created_at", { count: "exact" })
      .is("user_id", null)
      .order("sort_order", { ascending: true })
      .range(offset, offset + limit - 1),
    includeSettings
      ? admin
          .from("portfolio_settings")
          .select("key, value, updated_at")
          .order("key", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemsError || settingsRes.error) {
    return NextResponse.json(
      { error: itemsError?.message ?? settingsRes.error?.message ?? "Failed to load portfolio." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    page,
    limit,
    total: count ?? 0,
    items: items ?? [],
    settings: includeSettings ? settingsRes.data ?? [] : undefined,
  });
}
