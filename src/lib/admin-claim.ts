import { createAdminClient } from "@/lib/supabase/admin";

/** Allowed admin emails from env (BROSTUDIO_ADMIN_EMAILS and BROSTUDIO_FIRST_ADMIN_EMAIL). */
export function getAllowedAdminEmails(): string[] {
  const list = (process.env.BROSTUDIO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const first = (process.env.BROSTUDIO_FIRST_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (first && !list.includes(first)) list.push(first);
  return list;
}

/** If the given email is in the allowed list, upsert profile to admin. No-op if not allowed or on error. */
export async function ensureAdminForEmail(userId: string, userEmail: string): Promise<void> {
  const allowed = getAllowedAdminEmails();
  const email = (userEmail ?? "").trim().toLowerCase();
  if (!allowed.length || !allowed.includes(email)) return;
  try {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .upsert({ id: userId, email: userEmail, role: "admin" }, { onConflict: "id" });
  } catch {
    // ignore (e.g. missing env or Supabase error)
  }
}
