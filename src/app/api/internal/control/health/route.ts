import { NextResponse } from "next/server";
import { getInternalControlConfig, requireInternalControl } from "@/lib/internal-control";

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const config = getInternalControlConfig();

  return NextResponse.json({
    ok: true,
    service: "bros-studio-internal-control",
    auth_source: auth.source,
    control_token_env: config.envKey,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    integrations: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      r2: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME && process.env.R2_PUBLIC_URL),
      resend: Boolean(process.env.RESEND_API_KEY),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    },
  });
}
