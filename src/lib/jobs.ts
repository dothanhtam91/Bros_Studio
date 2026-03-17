import type { SupabaseClient } from "@supabase/supabase-js";
import slugifyAddress from "./slugify";

function slugifyPerson(s: string): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "client";
}

export const JOB_STATUSES = [
  "new_booking",
  "pending_confirmation",
  "scheduled",
  "shooting",
  "editing",
  "review",
  "delivered",
  "revision_requested",
  "completed",
  "cancelled",
] as const;

export const JOB_SOURCES = ["admin_created", "website_booking"] as const;

export const REVISION_REQUEST_TYPES = [
  "brightness_correction",
  "object_removal",
  "sky_replacement_adjustment",
  "image_reorder",
  "delivery_issue",
  "missing_file",
  "video_change_request",
  "other",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobSource = (typeof JOB_SOURCES)[number];

export interface BookingPayload {
  customer_name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  realtor_name?: string | null;
  property_address: string;
  listing_title?: string | null;
  service_type?: string | null;
  preferred_shooting_date?: string | null;
  notes?: string | null;
  estimated_price?: number | null;
}

/**
 * Match a website booking to an existing realtor by email, phone, then name+company.
 * Returns realtor id if found, null otherwise.
 */
export async function matchRealtorFromBooking(
  admin: SupabaseClient,
  payload: BookingPayload
): Promise<{ realtor_id: string } | null> {
  const email = payload.email?.trim().toLowerCase();
  const phone = payload.phone?.trim().replace(/\D/g, "");
  const name = payload.realtor_name?.trim();
  const company = payload.company_name?.trim();

  if (email) {
    const { data } = await admin
      .from("realtors")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (data) return { realtor_id: data.id };
  }

  if (phone && phone.length >= 10) {
    const { data } = await admin
      .from("realtors")
      .select("id")
      .ilike("phone", `%${phone.slice(-10)}%`)
      .limit(1)
      .maybeSingle();
    if (data) return { realtor_id: data.id };
  }

  if (name && name.length >= 2) {
    const { data } = await admin
      .from("realtors")
      .select("id")
      .ilike("name", name)
      .limit(1)
      .maybeSingle();
    if (data) return { realtor_id: data.id };
    if (company) {
      const { data: byCompany } = await admin
        .from("realtors")
        .select("id")
        .ilike("brokerage", company)
        .limit(1)
        .maybeSingle();
      if (byCompany) return { realtor_id: byCompany.id };
    }
  }

  return null;
}

/**
 * Find an existing customer by email (used when no realtor match).
 */
export async function findCustomerByEmail(
  admin: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const { data } = await admin
    .from("customers")
    .select("id")
    .ilike("email", normalized)
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id } : null;
}

/**
 * Find or create a customer for a website booking when no realtor matches.
 */
export async function findOrCreateCustomerFromBooking(
  admin: SupabaseClient,
  payload: BookingPayload
): Promise<{ id: string }> {
  const existing = await findCustomerByEmail(admin, payload.email);
  if (existing) return existing;
  const { data: customer, error } = await admin
    .from("customers")
    .insert({
      name: payload.customer_name,
      email: payload.email,
      phone: payload.phone || null,
      company: payload.company_name || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: customer.id };
}

/**
 * Find an album by realtor_id + address + shoot_date, or create one.
 */
export async function findOrCreateAlbumForJob(
  admin: SupabaseClient,
  realtorId: string,
  address: string,
  shootDate: string | null
): Promise<{ id: string; slug: string }> {
  const slugBase = slugifyAddress(address).slice(0, 60) || "property";
  const shoot = shootDate ? new Date(shootDate) : null;
  const dateStr = shoot ? shoot.toISOString().slice(0, 10) : null;

  const { data: existing } = await admin
    .from("albums")
    .select("id, slug")
    .eq("realtor_id", realtorId)
    .eq("address", address.trim())
    .eq("shoot_date", dateStr)
    .limit(1)
    .maybeSingle();

  if (existing) return { id: existing.id, slug: existing.slug };

  let slug = slugBase;
  const { data: slugCollision } = await admin
    .from("albums")
    .select("slug")
    .eq("realtor_id", realtorId)
    .eq("slug", slug);

  if (slugCollision?.length) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const { data: row, error } = await admin
    .from("albums")
    .insert({
      realtor_id: realtorId,
      slug,
      address: address.trim(),
      shoot_date: dateStr,
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);
  return { id: row.id, slug: row.slug };
}

/** Create a realtor from a customer so we can create an album (albums require realtor_id). Used when confirming shooting for customer-only jobs. Reuses existing realtor if one exists for this email. */
export async function createRealtorFromCustomer(
  admin: SupabaseClient,
  customer: { id: string; name: string; email: string; phone?: string | null; company?: string | null }
): Promise<{ id: string; slug: string }> {
  const email = customer.email.trim().toLowerCase();
  const { data: existingRealtor } = await admin
    .from("realtors")
    .select("id, slug")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  if (existingRealtor) return { id: existingRealtor.id, slug: existingRealtor.slug };

  const baseSlug = slugifyPerson(customer.name) || slugifyPerson(customer.email.split("@")[0]) || "client";
  let slug = `${baseSlug}-${customer.id.slice(0, 8)}`;
  const { data: slugTaken } = await admin.from("realtors").select("id").eq("slug", slug).maybeSingle();
  if (slugTaken) slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: row, error } = await admin
    .from("realtors")
    .insert({
      slug,
      name: customer.name.trim() || "Client",
      email,
      phone: customer.phone?.trim() || null,
      brokerage: customer.company?.trim() || null,
    })
    .select("id, slug")
    .single();
  if (error) throw new Error(error.message);
  return { id: row.id, slug: row.slug };
}
