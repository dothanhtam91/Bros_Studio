import { NextResponse } from "next/server";
import {
  badRequest,
  getInternalControlAdminClient,
  isRecord,
  requireInternalControl,
} from "@/lib/internal-control";
import {
  buildRealtorPatch,
  ensureUniqueRealtorSlug,
  findExistingRealtorByDedup,
  getConflictingRealtorFields,
} from "@/lib/realtors";

const SELECT_FIELDS =
  "id, slug, name, brokerage, phone, email, headshot_url, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin, user_id, created_at, updated_at";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id?.trim()) return badRequest("Realtor id is required.");

  const admin = getInternalControlAdminClient();
  const { data: realtor, error } = await admin.from("realtors").select(SELECT_FIELDS).eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  return NextResponse.json({ ok: true, auth_source: auth.source, realtor });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id?.trim()) return badRequest("Realtor id is required.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!isRecord(body)) return badRequest("Body must be a JSON object.");

  let patch;
  try {
    patch = buildRealtorPatch(body);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid payload.");
  }

  if (Object.keys(patch).length === 0) {
    return badRequest("No supported fields were provided.", {
      allowed_fields: [
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
      ],
    });
  }

  const admin = getInternalControlAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("realtors")
    .select(SELECT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

  try {
    const dedupe = await findExistingRealtorByDedup(admin, {
      email: (patch.email as string | null | undefined) ?? existing.email,
      phone: (patch.phone as string | null | undefined) ?? existing.phone,
      slug: (patch.slug as string | null | undefined) ?? existing.slug,
    });

    if (dedupe && dedupe.realtor.id !== id) {
      const conflicts = getConflictingRealtorFields(dedupe.realtor, patch);
      if (conflicts.length === 0) {
        return NextResponse.json({
          ok: true,
          updated: false,
          exact_match: true,
          matched_by: dedupe.matchedBy,
          realtor: dedupe.realtor,
        });
      }

      return NextResponse.json(
        {
          error: "Potential duplicate realtor found. Refusing to update this record.",
          matched_by: dedupe.matchedBy,
          conflicting_fields: conflicts,
          realtor: dedupe.realtor,
        },
        { status: 409 }
      );
    }

    if (typeof patch.slug === "string") {
      patch.slug = await ensureUniqueRealtorSlug(admin, patch.slug, id);
    }

    const conflictsWithSelf = getConflictingRealtorFields(existing, patch);
    if (conflictsWithSelf.length === 0) {
      return NextResponse.json({
        ok: true,
        updated: false,
        exact_match: true,
        realtor: existing,
      });
    }

    const { data: realtor, error } = await admin
      .from("realtors")
      .update(patch)
      .eq("id", id)
      .select(SELECT_FIELDS)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, updated: true, realtor });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update realtor." },
      { status: 500 }
    );
  }
}
