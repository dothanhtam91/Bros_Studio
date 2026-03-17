import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllowedAdminEmails } from "@/lib/admin-claim";

function grantAdmin(admin: ReturnType<typeof createAdminClient>, userId: string, userEmail: string) {
  return admin
    .from("profiles")
    .upsert(
      { id: userId, email: userEmail, role: "admin" },
      { onConflict: "id" }
    );
}

/** GET: diagnostic only (no secrets). Tells you what’s configured and your login email. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? null;
  const allowedEmails = getAllowedAdminEmails();
  const emailClaimConfigured = allowedEmails.length > 0;
  const secretClaimConfigured = Boolean((process.env.ADMIN_CLAIM_SECRET ?? "").trim());
  let supabaseConfigured = false;
  try {
    createAdminClient();
    supabaseConfigured = true;
  } catch {
    // missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
  }
  return NextResponse.json({
    loggedIn: !!user,
    userEmail,
    emailClaimConfigured,
    secretClaimConfigured,
    supabaseConfigured,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: "Server misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local" },
      { status: 500 }
    );
  }

  const userEmail = (user.email ?? "").trim().toLowerCase();

  // Option 1: Claim by email (no secret) — user's email must be in allowed list
  const allowedEmails = getAllowedAdminEmails();
  if (allowedEmails.length > 0 && allowedEmails.includes(userEmail)) {
    const { error } = await grantAdmin(admin, user.id, user.email ?? "");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "You are now an admin. Redirecting…" });
  }

  // Option 2: Claim by secret
  const secret = process.env.ADMIN_CLAIM_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error: "Admin claim not configured. Add to .env.local either ADMIN_CLAIM_SECRET=your-secret or BROSTUDIO_ADMIN_EMAILS=email1,email2 (comma-separated), then restart the dev server.",
      },
      { status: 400 }
    );
  }

  let body: { secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const given = String(body.secret ?? "").trim();
  const expected = String(secret).trim();
  if (body.secret === undefined || given !== expected) {
    return NextResponse.json(
      {
        error: "Invalid secret. Use the exact value of ADMIN_CLAIM_SECRET from .env.local (no extra spaces). Restart the dev server after changing .env.local.",
      },
      { status: 403 }
    );
  }

  const { error: upsertError } = await grantAdmin(admin, user.id, user.email ?? "");
  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "You are now an admin. Redirecting…" });
}
