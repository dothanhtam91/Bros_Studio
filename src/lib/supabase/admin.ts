import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add both to server env (e.g. Vercel → Settings → Environment Variables). The service role key is required for admin analytics and server-side writes; never expose it to the client."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
