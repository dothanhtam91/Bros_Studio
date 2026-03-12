import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Find a realtor by auth user id or by email.
 * If found by email, links the realtor to the user (sets user_id) so future logins match by user_id.
 */
export async function findRealtorByUserOrEmail(
  userId: string,
  email: string
): Promise<{ slug: string } | null> {
  const admin = createAdminClient();
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  if (!userId && !normalizedEmail) return null;

  const byUser = await admin
    .from("realtors")
    .select("id, slug, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUser?.data?.slug) return { slug: byUser.data.slug };

  if (!normalizedEmail) return null;

  const byEmail = await admin
    .from("realtors")
    .select("id, slug, user_id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (!byEmail?.data?.slug) return null;

  if (!byEmail.data.user_id) {
    await admin.from("realtors").update({ user_id: userId }).eq("id", byEmail.data.id);
  }
  return { slug: byEmail.data.slug };
}

/**
 * Create a new realtor from onboarding form and link to the auth user.
 */
export async function createRealtorFromOnboarding(
  userId: string,
  email: string,
  data: { name: string; phone?: string | null; brokerage?: string | null }
): Promise<{ slug: string }> {
  const admin = createAdminClient();
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email required");
  const name = (data.name ?? "").trim() || normalizedEmail.split("@")[0] || "Realtor";
  const baseSlug = slugify(name) || slugify(normalizedEmail.split("@")[0]) || "realtor";
  const slug = await ensureUniqueSlug(admin, baseSlug);

  const { error } = await admin
    .from("realtors")
    .insert({
      slug,
      name,
      email: normalizedEmail,
      phone: data.phone?.trim() || null,
      brokerage: data.brokerage?.trim() || null,
      user_id: userId,
    })
    .select("slug")
    .single();

  if (error) throw new Error(error.message);
  return { slug };
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureUniqueSlug(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  base: string
): Promise<string> {
  let slug = base;
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const { data } = await admin
      .from("realtors")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (!data) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
    attempts++;
  }

  return `${base}-${Date.now().toString(36)}`;
}
