import { NextResponse } from "next/server";
import {
  badRequest,
  getInternalControlAdminClient,
  isRecord,
  methodNotAllowed,
  parsePositiveInt,
  requireInternalControl,
} from "@/lib/internal-control";
import {
  buildRealtorPatch,
  ensureUniqueRealtorSlug,
  findExistingRealtorByDedup,
  getConflictingRealtorFields,
  normalizeRealtorInput,
  normalizeRealtorSlug,
} from "@/lib/realtors";

const SELECT_FIELDS =
  "id, slug, name, brokerage, phone, email, headshot_url, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin, user_id, created_at, updated_at";

const SORTS = new Set(["name", "newest", "updated"]);

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = parsePositiveInt(url.searchParams.get("limit"), 25, 100);
  const page = parsePositiveInt(url.searchParams.get("page"), 1, 1000);
  const sort = url.searchParams.get("sort")?.trim() || "name";
  const offset = (page - 1) * limit;

  if (!SORTS.has(sort)) {
    return NextResponse.json({ error: "Invalid sort", allowed: [...SORTS] }, { status: 400 });
  }

  const admin = getInternalControlAdminClient();
  let query = admin.from("realtors").select(SELECT_FIELDS, { count: "exact" });

  if (q) {
    query = query.or(
      [
        `name.ilike.%${q}%`,
        `slug.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `phone.ilike.%${q}%`,
        `brokerage.ilike.%${q}%`,
      ].join(",")
    );
  }

  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "updated") query = query.order("updated_at", { ascending: false });
  else query = query.order("name", { ascending: true });

  const { data: realtors, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    page,
    limit,
    total: count ?? 0,
    realtors: realtors ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!isRecord(body)) return badRequest("Body must be a JSON object.");

  let incoming;
  try {
    incoming = normalizeRealtorInput(body);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid payload.");
  }

  const admin = getInternalControlAdminClient();

  try {
    const requestedSlug = incoming.slug || normalizeRealtorSlug(incoming.name ?? "") || "realtor";
    const dedupe = await findExistingRealtorByDedup(admin, {
      email: incoming.email,
      phone: incoming.phone,
      slug: requestedSlug,
    });

    if (dedupe) {
      const conflicts = getConflictingRealtorFields(dedupe.realtor, {
        ...buildRealtorPatch(body),
        slug: requestedSlug,
        name: incoming.name,
      });

      if (conflicts.length === 0) {
        return NextResponse.json({
          ok: true,
          created: false,
          exact_match: true,
          matched_by: dedupe.matchedBy,
          realtor: dedupe.realtor,
        });
      }

      return NextResponse.json(
        {
          error: "Potential duplicate realtor found. Refusing to overwrite existing record.",
          matched_by: dedupe.matchedBy,
          conflicting_fields: conflicts,
          realtor: dedupe.realtor,
        },
        { status: 409 }
      );
    }

    const slug = await ensureUniqueRealtorSlug(admin, requestedSlug);
    const insertRow = {
      ...incoming,
      slug,
    };

    const { data: realtor, error } = await admin.from("realtors").insert(insertRow).select(SELECT_FIELDS).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(
      {
        ok: true,
        created: true,
        realtor,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create realtor." },
      { status: 500 }
    );
  }
}

export function PATCH() {
  return methodNotAllowed(["GET", "POST"]);
}
