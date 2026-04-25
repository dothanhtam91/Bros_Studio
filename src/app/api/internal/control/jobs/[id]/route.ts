import { NextResponse } from "next/server";
import { JOB_STATUSES } from "@/lib/jobs";
import {
  badRequest,
  getInternalControlAdminClient,
  isRecord,
  normalizeOptionalDate,
  normalizeOptionalString,
  normalizeOptionalUuid,
  requireInternalControl,
} from "@/lib/internal-control";

const PRIORITIES = ["low", "normal", "high", "rush"] as const;

function parseStatus(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error("status must be a string.");
  const trimmed = value.trim();
  if (!JOB_STATUSES.includes(trimmed as (typeof JOB_STATUSES)[number])) {
    throw new Error(`status must be one of: ${JOB_STATUSES.join(", ")}.`);
  }
  return trimmed;
}

function parsePriority(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error("priority must be a string.");
  const trimmed = value.trim().toLowerCase();
  if (!PRIORITIES.includes(trimmed as (typeof PRIORITIES)[number])) {
    throw new Error(`priority must be one of: ${PRIORITIES.join(", ")}.`);
  }
  return trimmed;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id?.trim()) return badRequest("Job id is required.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!isRecord(body)) {
    return badRequest("Body must be a JSON object.");
  }

  let updates: Record<string, string | null | undefined>;
  try {
    updates = {
      status: parseStatus(body.status) ?? undefined,
      priority: parsePriority(body.priority) ?? undefined,
      listing_title: body.listing_title === undefined ? undefined : normalizeOptionalString(body.listing_title, 160),
      service_type: body.service_type === undefined ? undefined : normalizeOptionalString(body.service_type, 120),
      notes: body.notes === undefined ? undefined : normalizeOptionalString(body.notes, 4000),
      shooting_date: body.shooting_date === undefined ? undefined : normalizeOptionalDate(body.shooting_date),
      delivery_deadline: body.delivery_deadline === undefined ? undefined : normalizeOptionalDate(body.delivery_deadline),
      assigned_photographer_id:
        body.assigned_photographer_id === undefined ? undefined : normalizeOptionalUuid(body.assigned_photographer_id),
      assigned_editor_id:
        body.assigned_editor_id === undefined ? undefined : normalizeOptionalUuid(body.assigned_editor_id),
    };
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid payload.");
  }

  const patch = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
  if (Object.keys(patch).length === 0) {
    return badRequest("No supported fields were provided.", {
      allowed_fields: [
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
    });
  }

  const admin = getInternalControlAdminClient();

  const { data: existingJob, error: existingError } = await admin
    .from("jobs")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existingJob) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { data: job, error } = await admin
    .from("jobs")
    .update(patch)
    .eq("id", id)
    .select(
      "id, source, realtor_id, customer_id, album_id, property_address, listing_title, service_type, shooting_date, delivery_deadline, delivered_at, total_price, priority, status, notes, assigned_photographer_id, assigned_editor_id, created_at, updated_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (typeof patch.status === "string" && patch.status !== existingJob.status) {
    await admin.from("job_timeline_events").insert({
      job_id: id,
      event_type: "internal_control_status_update",
      message: `Status changed from ${existingJob.status} to ${patch.status}`,
      metadata: {
        source: "internal_control",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    message: "Job updated.",
    job,
  });
}
