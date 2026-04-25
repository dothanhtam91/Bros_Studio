import type { SupabaseClient } from "@supabase/supabase-js";
import { JOB_SOURCES, JOB_STATUSES } from "@/lib/jobs";
import slugifyAddress from "@/lib/slugify";
import {
  buildRealtorPatch,
  ensureUniqueRealtorSlug,
  findExistingRealtorByDedup,
  getConflictingRealtorFields,
  normalizeRealtorInput,
  normalizeRealtorSlug,
} from "@/lib/realtors";

export type ControlOperation = "list" | "get" | "create" | "update" | "delete";
export type ControlResourceName = keyof typeof CONTROL_RESOURCES;

type FieldKind = "string" | "text" | "uuid" | "date" | "timestamp" | "url" | "number" | "integer" | "boolean" | "enum";

type FieldConfig = {
  kind: FieldKind;
  max?: number;
  nullable?: boolean;
  enum?: readonly string[];
};

type ResourceConfig = {
  table: string;
  primaryKey: string;
  select: string;
  defaultSort: { field: string; ascending: boolean };
  sortable: Record<string, { field: string; ascending: boolean }>;
  filterable: string[];
  searchable?: string[];
  createFields: Record<string, FieldConfig>;
  updateFields: Record<string, FieldConfig>;
  requiredCreateFields?: string[];
  canDelete?: boolean;
};

const PRIORITIES = ["low", "normal", "high", "rush"] as const;
const REVISION_STATUSES = ["open", "in_progress", "resolved", "dismissed"] as const;

const uuidField = (nullable = true): FieldConfig => ({ kind: "uuid", nullable });
const stringField = (max = 240, nullable = true): FieldConfig => ({ kind: "string", max, nullable });
const textField = (max = 4000, nullable = true): FieldConfig => ({ kind: "text", max, nullable });
const urlField = (nullable = true): FieldConfig => ({ kind: "url", max: 1000, nullable });
const dateField = (nullable = true): FieldConfig => ({ kind: "date", nullable });
const timestampField = (nullable = true): FieldConfig => ({ kind: "timestamp", nullable });
const enumField = (values: readonly string[], nullable = false): FieldConfig => ({ kind: "enum", enum: values, nullable });

const realtorFields = {
  slug: stringField(80, true),
  name: stringField(120, false),
  brokerage: stringField(160, true),
  phone: stringField(40, true),
  email: stringField(160, true),
  headshot_url: urlField(true),
  title: stringField(160, true),
  website: urlField(true),
  brokerage_logo_url: urlField(true),
  tagline: stringField(240, true),
  instagram: stringField(200, true),
  facebook: stringField(200, true),
  linkedin: stringField(300, true),
};

const jobFields = {
  source: enumField(JOB_SOURCES),
  realtor_id: uuidField(true),
  customer_id: uuidField(true),
  album_id: uuidField(true),
  property_address: stringField(500, false),
  listing_title: stringField(160, true),
  service_type: stringField(120, true),
  shooting_date: dateField(true),
  delivery_deadline: dateField(true),
  delivered_at: timestampField(true),
  total_price: { kind: "number", nullable: true } satisfies FieldConfig,
  priority: enumField(PRIORITIES, true),
  status: enumField(JOB_STATUSES),
  notes: textField(4000, true),
  assigned_photographer_id: uuidField(true),
  assigned_editor_id: uuidField(true),
  delivery_token: stringField(160, true),
};

const albumFields = {
  realtor_id: uuidField(false),
  job_id: uuidField(true),
  slug: stringField(90, true),
  address: stringField(500, false),
  shoot_date: dateField(true),
  cover_image_id: uuidField(true),
  video_url: urlField(true),
  mls_preview_url: urlField(true),
  drive_full_download_url: urlField(true),
};

const albumImageFields = {
  album_id: uuidField(false),
  image_url: urlField(false),
  storage_key: stringField(1000, true),
  drive_file_id: stringField(300, true),
  mls_preview_url: urlField(true),
  full_download_url: urlField(true),
  sort_order: { kind: "integer", nullable: true } satisfies FieldConfig,
};

export const CONTROL_RESOURCES = {
  jobs: {
    table: "jobs",
    primaryKey: "id",
    select:
      "id, source, realtor_id, customer_id, album_id, property_address, listing_title, service_type, shooting_date, delivery_deadline, delivered_at, total_price, priority, status, notes, assigned_photographer_id, assigned_editor_id, delivery_token, created_at, updated_at",
    defaultSort: { field: "created_at", ascending: false },
    sortable: {
      newest: { field: "created_at", ascending: false },
      oldest: { field: "created_at", ascending: true },
      updated: { field: "updated_at", ascending: false },
      deadline: { field: "delivery_deadline", ascending: true },
      shooting_date: { field: "shooting_date", ascending: true },
    },
    filterable: ["id", "source", "status", "priority", "realtor_id", "customer_id", "album_id"],
    searchable: ["property_address", "listing_title", "service_type", "notes"],
    createFields: jobFields,
    updateFields: { ...jobFields, source: undefined as never, property_address: stringField(500, true) },
    requiredCreateFields: ["source", "property_address", "status"],
    canDelete: true,
  },
  realtors: {
    table: "realtors",
    primaryKey: "id",
    select:
      "id, slug, name, brokerage, phone, email, headshot_url, title, website, brokerage_logo_url, tagline, instagram, facebook, linkedin, user_id, created_at, updated_at",
    defaultSort: { field: "name", ascending: true },
    sortable: {
      name: { field: "name", ascending: true },
      newest: { field: "created_at", ascending: false },
      updated: { field: "updated_at", ascending: false },
    },
    filterable: ["id", "slug", "email", "phone", "user_id"],
    searchable: ["name", "slug", "email", "phone", "brokerage"],
    createFields: realtorFields,
    updateFields: realtorFields,
    requiredCreateFields: ["name"],
    canDelete: true,
  },
  albums: {
    table: "albums",
    primaryKey: "id",
    select:
      "id, realtor_id, job_id, slug, address, shoot_date, cover_image_id, video_url, mls_preview_url, drive_full_download_url, created_at, updated_at",
    defaultSort: { field: "created_at", ascending: false },
    sortable: {
      newest: { field: "created_at", ascending: false },
      oldest: { field: "created_at", ascending: true },
      shoot_date: { field: "shoot_date", ascending: false },
      updated: { field: "updated_at", ascending: false },
    },
    filterable: ["id", "realtor_id", "job_id", "slug"],
    searchable: ["address", "slug"],
    createFields: albumFields,
    updateFields: albumFields,
    requiredCreateFields: ["realtor_id", "address"],
    canDelete: true,
  },
  album_images: {
    table: "album_images",
    primaryKey: "id",
    select: "id, album_id, image_url, storage_key, drive_file_id, mls_preview_url, full_download_url, sort_order, created_at",
    defaultSort: { field: "sort_order", ascending: true },
    sortable: {
      order: { field: "sort_order", ascending: true },
      newest: { field: "created_at", ascending: false },
    },
    filterable: ["id", "album_id", "drive_file_id"],
    searchable: ["image_url", "storage_key", "drive_file_id"],
    createFields: albumImageFields,
    updateFields: albumImageFields,
    requiredCreateFields: ["album_id", "image_url"],
    canDelete: true,
  },
  portfolio_items: {
    table: "portfolio_items",
    primaryKey: "id",
    select: "id, user_id, drive_file_id, name, folder_label, sort_order, created_at",
    defaultSort: { field: "sort_order", ascending: true },
    sortable: {
      order: { field: "sort_order", ascending: true },
      newest: { field: "created_at", ascending: false },
      name: { field: "name", ascending: true },
    },
    filterable: ["id", "user_id", "drive_file_id", "folder_label"],
    searchable: ["name", "folder_label", "drive_file_id"],
    createFields: {
      user_id: uuidField(true),
      drive_file_id: stringField(300, false),
      name: stringField(300, false),
      folder_label: stringField(120, true),
      sort_order: { kind: "integer", nullable: true } satisfies FieldConfig,
    },
    updateFields: {
      user_id: uuidField(true),
      name: stringField(300, true),
      folder_label: stringField(120, true),
      sort_order: { kind: "integer", nullable: true } satisfies FieldConfig,
    },
    requiredCreateFields: ["drive_file_id", "name"],
    canDelete: true,
  },
  portfolio_settings: {
    table: "portfolio_settings",
    primaryKey: "key",
    select: "key, value, updated_at",
    defaultSort: { field: "key", ascending: true },
    sortable: { key: { field: "key", ascending: true }, updated: { field: "updated_at", ascending: false } },
    filterable: ["key"],
    searchable: ["key", "value"],
    createFields: { key: stringField(80, false), value: stringField(1000, true) },
    updateFields: { value: stringField(1000, true) },
    requiredCreateFields: ["key"],
    canDelete: false,
  },
  revision_requests: {
    table: "revision_requests",
    primaryKey: "id",
    select: "id, job_id, realtor_id, customer_id, type, message, status, created_at, resolved_at, resolved_by",
    defaultSort: { field: "created_at", ascending: false },
    sortable: { newest: { field: "created_at", ascending: false }, status: { field: "status", ascending: true } },
    filterable: ["id", "job_id", "realtor_id", "customer_id", "status", "type"],
    searchable: ["message", "type"],
    createFields: {
      job_id: uuidField(false),
      realtor_id: uuidField(true),
      customer_id: uuidField(true),
      type: stringField(120, false),
      message: textField(4000, true),
      status: enumField(REVISION_STATUSES, true),
    },
    updateFields: {
      type: stringField(120, true),
      message: textField(4000, true),
      status: enumField(REVISION_STATUSES, true),
      resolved_at: timestampField(true),
      resolved_by: uuidField(true),
    },
    requiredCreateFields: ["job_id", "type"],
    canDelete: true,
  },
} as const satisfies Record<string, ResourceConfig>;

export function listControlResourceContracts() {
  return Object.fromEntries(
    Object.entries(CONTROL_RESOURCES).map(([name, config]) => [
      name,
      {
        operations: ["list", "get", "create", "update", ...(config.canDelete ? ["delete"] : [])],
        primary_key: config.primaryKey,
        filterable: config.filterable,
        searchable: config.searchable ?? [],
        sortable: Object.keys(config.sortable),
        create_fields: Object.keys(config.createFields),
        update_fields: Object.entries(config.updateFields).filter(([, fieldConfig]) => fieldConfig).map(([field]) => field),
        required_create_fields: config.requiredCreateFields ?? [],
      },
    ])
  );
}

export function parseAction(input: unknown): { operation: ControlOperation; resource: ControlResourceName } {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Body must be a JSON object.");
  const body = input as Record<string, unknown>;
  let resource = typeof body.resource === "string" ? body.resource.trim() : "";
  let operation = typeof body.operation === "string" ? body.operation.trim() : "";
  const action = typeof body.action === "string" ? body.action.trim() : "";

  if (action && action.includes(".")) {
    const [left, right] = action.split(".");
    if (!resource && left) resource = left;
    if (!operation && right) operation = right;
  } else if (action && !operation) {
    operation = action;
  }

  if (!resource || !(resource in CONTROL_RESOURCES)) {
    throw new Error(`Unsupported resource. Allowed: ${Object.keys(CONTROL_RESOURCES).join(", ")}.`);
  }
  if (!["list", "get", "create", "update", "delete"].includes(operation)) {
    throw new Error("Unsupported operation. Use list, get, create, update, or delete.");
  }
  const config = CONTROL_RESOURCES[resource as ControlResourceName];
  if (operation === "delete" && !config.canDelete) throw new Error(`${resource} does not allow delete.`);
  return { operation: operation as ControlOperation, resource: resource as ControlResourceName };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a JSON object.`);
  return value as Record<string, unknown>;
}

function normalizeValue(field: string, value: unknown, config: FieldConfig) {
  if (value === undefined) return undefined;
  if (value === null || value === "") {
    if (config.nullable) return null;
    throw new Error(`${field} is required.`);
  }

  if (config.kind === "boolean") {
    if (typeof value !== "boolean") throw new Error(`${field} must be a boolean.`);
    return value;
  }

  if (config.kind === "number") {
    const numberValue = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(numberValue)) throw new Error(`${field} must be a number.`);
    return numberValue;
  }

  if (config.kind === "integer") {
    const numberValue = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isInteger(numberValue)) throw new Error(`${field} must be an integer.`);
    return numberValue;
  }

  if (typeof value !== "string") throw new Error(`${field} must be a string.`);
  const trimmed = value.trim();
  if (!trimmed) {
    if (config.nullable) return null;
    throw new Error(`${field} is required.`);
  }

  if (config.kind === "uuid") {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
      throw new Error(`${field} must be a UUID.`);
    }
    return trimmed;
  }

  if (config.kind === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) throw new Error(`${field} must use YYYY-MM-DD format.`);
    return trimmed;
  }

  if (config.kind === "timestamp") {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) throw new Error(`${field} must be an ISO timestamp.`);
    return date.toISOString();
  }

  if (config.kind === "url") {
    try {
      const url = new URL(trimmed);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error("bad protocol");
      return url.toString().slice(0, config.max ?? 1000);
    } catch {
      throw new Error(`${field} must be a valid http(s) URL.`);
    }
  }

  if (config.kind === "enum") {
    const allowed = config.enum ?? [];
    if (!allowed.includes(trimmed)) throw new Error(`${field} must be one of: ${allowed.join(", ")}.`);
    return trimmed;
  }

  return trimmed.slice(0, config.max ?? (config.kind === "text" ? 4000 : 240));
}

function normalizePayload(
  payload: Record<string, unknown>,
  fieldConfigs: Record<string, FieldConfig>,
  requiredFields: string[] = []
) {
  const allowed = Object.entries(fieldConfigs).filter(([, config]) => config);
  const unknownFields = Object.keys(payload).filter((field) => !fieldConfigs[field]);
  if (unknownFields.length) throw new Error(`Unsupported field(s): ${unknownFields.join(", ")}.`);

  const row: Record<string, unknown> = {};
  for (const [field, config] of allowed) {
    if (payload[field] !== undefined) row[field] = normalizeValue(field, payload[field], config);
  }
  for (const field of requiredFields) {
    if (row[field] === undefined || row[field] === null || row[field] === "") throw new Error(`${field} is required.`);
  }
  return row;
}

function getId(body: Record<string, unknown>, config: ResourceConfig) {
  const id = body.id ?? body[config.primaryKey];
  if (typeof id !== "string" || !id.trim()) throw new Error(`${config.primaryKey} is required.`);
  return id.trim();
}

async function createRealtor(admin: SupabaseClient, data: Record<string, unknown>, select: string) {
  const incoming = normalizeRealtorInput(data);
  const requestedSlug = incoming.slug || normalizeRealtorSlug(incoming.name ?? "") || "realtor";
  const dedupe = await findExistingRealtorByDedup(admin, {
    email: incoming.email,
    phone: incoming.phone,
    slug: requestedSlug,
  });
  if (dedupe) {
    const conflicts = getConflictingRealtorFields(dedupe.realtor, { ...incoming, slug: requestedSlug });
    if (conflicts.length === 0) return { data: dedupe.realtor, created: false, exact_match: true, matched_by: dedupe.matchedBy };
    const error = new Error("Potential duplicate realtor found. Refusing to overwrite existing record.");
    Object.assign(error, { status: 409, details: { matched_by: dedupe.matchedBy, conflicting_fields: conflicts, realtor: dedupe.realtor } });
    throw error;
  }

  const slug = await ensureUniqueRealtorSlug(admin, requestedSlug);
  const { data: row, error } = await admin.from("realtors").insert({ ...incoming, slug }).select(select).single();
  if (error) throw error;
  return { data: row, created: true };
}

async function updateRealtor(admin: SupabaseClient, id: string, data: Record<string, unknown>, select: string) {
  const patch = buildRealtorPatch(data);
  if (Object.keys(patch).length === 0) throw new Error("No supported fields were provided.");

  const { data: existing, error: existingError } = await admin.from("realtors").select(select).eq("id", id).maybeSingle();
  if (existingError) throw existingError;
  if (!existing) Object.assign(new Error("Realtor not found."), { status: 404 });
  if (!existing) throw Object.assign(new Error("Realtor not found."), { status: 404 });

  const existingRealtor = existing as { email?: string | null; phone?: string | null; slug?: string | null };
  const dedupe = await findExistingRealtorByDedup(admin, {
    email: (patch.email as string | null | undefined) ?? existingRealtor.email,
    phone: (patch.phone as string | null | undefined) ?? existingRealtor.phone,
    slug: (patch.slug as string | null | undefined) ?? existingRealtor.slug,
  });
  if (dedupe && dedupe.realtor.id !== id) {
    const conflicts = getConflictingRealtorFields(dedupe.realtor, patch);
    const error = new Error("Potential duplicate realtor found. Refusing to update this record.");
    Object.assign(error, { status: 409, details: { matched_by: dedupe.matchedBy, conflicting_fields: conflicts, realtor: dedupe.realtor } });
    throw error;
  }

  if (typeof patch.slug === "string") patch.slug = await ensureUniqueRealtorSlug(admin, patch.slug, id);

  const { data: row, error } = await admin.from("realtors").update(patch).eq("id", id).select(select).single();
  if (error) throw error;
  return row;
}

async function beforeCreate(resource: ControlResourceName, admin: SupabaseClient, row: Record<string, unknown>) {
  if (resource === "albums") {
    if (!row.slug && typeof row.address === "string") {
      let slug = slugifyAddress(row.address).slice(0, 80) || "property";
      const { data: existing } = await admin
        .from("albums")
        .select("slug")
        .eq("realtor_id", row.realtor_id)
        .eq("slug", slug);
      if (existing?.length) slug = `${slug}-${Date.now().toString(36)}`;
      row.slug = slug;
    }
  }
  if (resource === "portfolio_settings") {
    row.updated_at = new Date().toISOString();
  }
  return row;
}

async function writeAuditEvent(admin: SupabaseClient, params: { resource: string; operation: string; id?: string; data?: Record<string, unknown> }) {
  if (params.resource !== "jobs") return;
  const jobId = params.id ?? (typeof params.data?.id === "string" ? params.data.id : null);
  if (!jobId) return;
  await admin.from("job_timeline_events").insert({
    job_id: jobId,
    event_type: `internal_control_${params.operation}`,
    message: `Internal control ${params.operation} on jobs`,
    metadata: { source: "internal_control", operation: params.operation },
  });
}

export async function executeControlAction(admin: SupabaseClient, body: Record<string, unknown>) {
  const { operation, resource } = parseAction(body);
  const config: ResourceConfig = CONTROL_RESOURCES[resource];
  const params = asRecord(body.params, "params");
  const filters = asRecord(body.filters ?? params.filters, "filters");
  const data = asRecord(body.data ?? params.data, "data");
  const options = asRecord(body.options ?? params.options, "options");

  if (operation === "list") {
    const page = Math.min(Math.max(Number(options.page ?? body.page ?? 1) || 1, 1), 1000);
    const limit = Math.min(Math.max(Number(options.limit ?? body.limit ?? 25) || 25, 1), 200);
    const sortKey = String(options.sort ?? body.sort ?? "");
    const sort = sortKey && config.sortable[sortKey] ? config.sortable[sortKey] : config.defaultSort;
    const offset = (page - 1) * limit;

    let query = admin.from(config.table).select(config.select, { count: "exact" });
    for (const [field, value] of Object.entries(filters)) {
      if (!config.filterable.includes(field)) throw new Error(`${field} is not filterable for ${resource}.`);
      if (Array.isArray(value)) query = query.in(field, value.map(String));
      else if (value === null) query = query.is(field, null);
      else query = query.eq(field, String(value));
    }

    const q = typeof (options.q ?? body.q) === "string" ? String(options.q ?? body.q).trim() : "";
    if (q && config.searchable?.length) {
      const escaped = q.replace(/[%,]/g, "");
      query = query.or(config.searchable.map((field) => `${field}.ilike.%${escaped}%`).join(","));
    }

    const { data: rows, error, count } = await query
      .order(sort.field, { ascending: sort.ascending, nullsFirst: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return { resource, operation, page, limit, total: count ?? 0, rows: rows ?? [] };
  }

  if (operation === "get") {
    const id = getId(body, config);
    const { data: row, error } = await admin.from(config.table).select(config.select).eq(config.primaryKey, id).maybeSingle();
    if (error) throw error;
    if (!row) throw Object.assign(new Error(`${resource} record not found.`), { status: 404 });
    return { resource, operation, row };
  }

  if (operation === "create") {
    if (resource === "realtors") {
      const result = await createRealtor(admin, data, config.select);
      return { resource, operation, ...result };
    }
    const row = await beforeCreate(resource, admin, normalizePayload(data, config.createFields, config.requiredCreateFields));
    const { data: created, error } = await admin.from(config.table).insert(row).select(config.select).single();
    if (error) throw error;
    const createdRow = created as unknown as Record<string, unknown>;
    await writeAuditEvent(admin, { resource, operation, id: typeof createdRow.id === "string" ? createdRow.id : undefined, data: createdRow });
    return { resource, operation, created: true, data: created };
  }

  if (operation === "update") {
    const id = getId(body, config);
    if (resource === "realtors") {
      const row = await updateRealtor(admin, id, data, config.select);
      return { resource, operation, updated: true, data: row };
    }
    const row = normalizePayload(data, config.updateFields);
    if (Object.keys(row).length === 0) throw new Error("No supported fields were provided.");
    if (resource === "portfolio_settings") row.updated_at = new Date().toISOString();
    const { data: updated, error } = await admin.from(config.table).update(row).eq(config.primaryKey, id).select(config.select).single();
    if (error) throw error;
    await writeAuditEvent(admin, { resource, operation, id, data: row });
    return { resource, operation, updated: true, data: updated };
  }

  const id = getId(body, config);
  const { data: deleted, error } = await admin.from(config.table).delete().eq(config.primaryKey, id).select(config.select).single();
  if (error) throw error;
  await writeAuditEvent(admin, { resource, operation, id });
  return { resource, operation, deleted: true, data: deleted };
}
