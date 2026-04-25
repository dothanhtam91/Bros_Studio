import { NextResponse } from "next/server";
import {
  badRequest,
  getInternalControlAdminClient,
  isRecord,
  normalizeOptionalString,
  requireInternalControl,
} from "@/lib/internal-control";

const WRITABLE_PORTFOLIO_SETTINGS = new Set(["drive_folder_id"]);

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const admin = getInternalControlAdminClient();
  const { data, error } = await admin
    .from("portfolio_settings")
    .select("key, value, updated_at")
    .order("key", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    settings: data ?? [],
    writable_keys: [...WRITABLE_PORTFOLIO_SETTINGS],
  });
}

export async function PATCH(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!isRecord(body)) {
    return badRequest("Body must be a JSON object.");
  }

  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!WRITABLE_PORTFOLIO_SETTINGS.has(key)) {
    return badRequest("Unsupported setting key.", { writable_keys: [...WRITABLE_PORTFOLIO_SETTINGS] });
  }

  const value = normalizeOptionalString(body.value, 500);
  if (key === "drive_folder_id" && value && !/^[A-Za-z0-9_-]{10,}$/.test(value)) {
    return badRequest("drive_folder_id must look like a Google Drive folder id.");
  }

  const admin = getInternalControlAdminClient();
  const { data, error } = await admin
    .from("portfolio_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select("key, value, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    message: "Portfolio setting updated.",
    setting: data,
  });
}
