import { NextResponse } from "next/server";
import { getInternalControlAdminClient, getInternalControlConfig, requireInternalControl } from "@/lib/internal-control";

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const admin = getInternalControlAdminClient();
  const { data: portfolioSettings, error } = await admin
    .from("portfolio_settings")
    .select("key, value, updated_at")
    .order("key", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const controlConfig = getInternalControlConfig();

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    control: {
      configured: controlConfig.configured,
      env_key: controlConfig.envKey,
      accepted_auth: ["Authorization: Bearer <token>", "x-lilbin-control-token: <token>"],
    },
    writable: {
      jobs: [
        "status",
        "priority",
        "listing_title",
        "service_type",
        "notes",
        "shooting_date",
        "delivery_deadline",
        "assigned_photographer_id",
        "assigned_editor_id",
      ],
      portfolio_settings: ["drive_folder_id"],
    },
    readonly: {
      integrations: {
        supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        r2: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME && process.env.R2_PUBLIC_URL),
        resend: Boolean(process.env.RESEND_API_KEY),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      },
      portfolio_settings: portfolioSettings ?? [],
    },
  });
}
