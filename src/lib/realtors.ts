import type { SupabaseClient } from "@supabase/supabase-js";

export const REALTOR_MUTABLE_FIELDS = [
  "slug",
  "name",
  "brokerage",
  "phone",
  "email",
  "headshot_url",
  "title",
  "website",
  "brokerage_logo_url",
  "tagline",
  "instagram",
  "facebook",
  "linkedin",
] as const;

export type RealtorMutableField = (typeof REALTOR_MUTABLE_FIELDS)[number];

export type RealtorPayload = Partial<Record<RealtorMutableField, unknown>>;

export type NormalizedRealtorData = {
  slug: string | null;
  name: string | null;
  brokerage: string | null;
  phone: string | null;
  email: string | null;
  headshot_url: string | null;
  title: string | null;
  website: string | null;
  brokerage_logo_url: string | null;
  tagline: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
};

export type RealtorRecord = NormalizedRealtorData & {
  id: string;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

const URL_FIELDS = new Set<RealtorMutableField>(["headshot_url", "website", "brokerage_logo_url"]);

export function normalizeRealtorSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function normalizeEmail(value: string | null | undefined) {
  const trimmed = (value ?? "").trim().toLowerCase();
  return trimmed || null;
}

export function normalizePhoneDigits(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || null;
}

function normalizeOptionalString(value: unknown, maxLength: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error("Expected a string.");
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function normalizeOptionalUrl(value: unknown) {
  const normalized = normalizeOptionalString(value, 500);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("URL must start with http:// or https://");
    }
    return url.toString();
  } catch {
    throw new Error("Invalid URL.");
  }
}

function validateEmail(value: string | null) {
  if (!value) return value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Invalid email address.");
  }
  return value;
}

function validatePhone(value: string | null) {
  if (!value) return value;
  const digits = normalizePhoneDigits(value);
  if (!digits || digits.length < 7 || digits.length > 15) {
    throw new Error("Phone must contain 7 to 15 digits.");
  }
  return value;
}

export function normalizeRealtorInput(payload: RealtorPayload, options?: { partial?: boolean }) {
  const partial = options?.partial ?? false;
  const normalized: NormalizedRealtorData = {
    slug:
      payload.slug === undefined
        ? partial
          ? null
          : null
        : normalizeRealtorSlug(String(payload.slug ?? "")) || null,
    name: payload.name === undefined ? (partial ? null : null) : normalizeOptionalString(payload.name, 120),
    brokerage: payload.brokerage === undefined ? (partial ? null : null) : normalizeOptionalString(payload.brokerage, 160),
    phone: payload.phone === undefined ? (partial ? null : null) : validatePhone(normalizeOptionalString(payload.phone, 40)),
    email: payload.email === undefined ? (partial ? null : null) : validateEmail(normalizeEmail(normalizeOptionalString(payload.email, 160))),
    headshot_url:
      payload.headshot_url === undefined ? (partial ? null : null) : normalizeOptionalUrl(payload.headshot_url),
    title: payload.title === undefined ? (partial ? null : null) : normalizeOptionalString(payload.title, 160),
    website: payload.website === undefined ? (partial ? null : null) : normalizeOptionalUrl(payload.website),
    brokerage_logo_url:
      payload.brokerage_logo_url === undefined ? (partial ? null : null) : normalizeOptionalUrl(payload.brokerage_logo_url),
    tagline: payload.tagline === undefined ? (partial ? null : null) : normalizeOptionalString(payload.tagline, 240),
    instagram: payload.instagram === undefined ? (partial ? null : null) : normalizeOptionalString(payload.instagram, 200),
    facebook: payload.facebook === undefined ? (partial ? null : null) : normalizeOptionalString(payload.facebook, 200),
    linkedin: payload.linkedin === undefined ? (partial ? null : null) : normalizeOptionalString(payload.linkedin, 300),
  };

  if (!partial) {
    if (!normalized.name) throw new Error("name is required.");
  }

  if (payload.slug !== undefined && !normalized.slug) {
    throw new Error("slug must contain letters or numbers.");
  }

  return normalized;
}

export function buildRealtorPatch(payload: RealtorPayload) {
  const normalized = normalizeRealtorInput(payload, { partial: true });
  const patch = Object.fromEntries(
    REALTOR_MUTABLE_FIELDS.filter((field) => payload[field] !== undefined).map((field) => [field, normalized[field]])
  ) as Partial<NormalizedRealtorData>;
  return patch;
}

export async function ensureUniqueRealtorSlug(admin: SupabaseClient, preferred: string, excludeId?: string) {
  const base = normalizeRealtorSlug(preferred) || "realtor";
  let slug = base;
  let suffix = 2;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    let query = admin.from("realtors").select("id").eq("slug", slug).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return `${base}-${Date.now().toString(36)}`;
}

export function comparableRealtorValue(field: keyof NormalizedRealtorData, value: unknown) {
  if (value == null) return null;
  if (field === "email") return normalizeEmail(String(value));
  if (field === "phone") return normalizePhoneDigits(String(value));
  if (field === "slug") return normalizeRealtorSlug(String(value)) || null;
  if (URL_FIELDS.has(field as RealtorMutableField)) {
    try {
      return new URL(String(value)).toString();
    } catch {
      return String(value).trim() || null;
    }
  }
  return typeof value === "string" ? value.trim() || null : String(value);
}

export function getConflictingRealtorFields(existing: Partial<RealtorRecord>, incoming: Partial<NormalizedRealtorData>) {
  return REALTOR_MUTABLE_FIELDS.filter((field) => {
    if (incoming[field] === undefined) return false;
    return comparableRealtorValue(field, existing[field]) !== comparableRealtorValue(field, incoming[field]);
  });
}

export async function findExistingRealtorByDedup(admin: SupabaseClient, input: { email?: string | null; phone?: string | null; slug?: string | null }) {
  const normalizedEmail = normalizeEmail(input.email);
  if (normalizedEmail) {
    const { data, error } = await admin
      .from("realtors")
      .select("id, slug, name, brokerage, phone, email, headshot_url, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin, user_id, created_at, updated_at")
      .ilike("email", normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { realtor: data as RealtorRecord, matchedBy: "email" as const };
  }

  const normalizedPhone = normalizePhoneDigits(input.phone);
  if (normalizedPhone) {
    const last10 = normalizedPhone.slice(-10);
    const { data, error } = await admin
      .from("realtors")
      .select("id, slug, name, brokerage, phone, email, headshot_url, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin, user_id, created_at, updated_at")
      .ilike("phone", `%${last10}%`)
      .limit(20);
    if (error) throw new Error(error.message);
    const exact = (data ?? []).find((row) => normalizePhoneDigits(row.phone) === normalizedPhone) ?? null;
    if (exact) return { realtor: exact as RealtorRecord, matchedBy: "phone" as const };
  }

  const normalizedSlug = normalizeRealtorSlug(input.slug ?? "");
  if (normalizedSlug) {
    const { data, error } = await admin
      .from("realtors")
      .select("id, slug, name, brokerage, phone, email, headshot_url, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin, user_id, created_at, updated_at")
      .eq("slug", normalizedSlug)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { realtor: data as RealtorRecord, matchedBy: "slug" as const };
  }

  return null;
}
