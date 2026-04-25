import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CONTROL_TOKEN_HEADER = "x-lilbin-control-token";
const CONTROL_TOKEN_QUERY_PARAM = "control_token";

export type ControlTokenSource = "authorization" | typeof CONTROL_TOKEN_HEADER | typeof CONTROL_TOKEN_QUERY_PARAM;

export type ControlAuthSuccess = {
  ok: true;
  source: ControlTokenSource;
};

export type ControlAuthFailure = {
  ok: false;
  response: NextResponse;
};

export function getInternalControlConfig() {
  const lilBinToken = process.env.LILBIN_CONTROL_TOKEN?.trim() ?? "";
  const fallbackToken = process.env.ADMIN_CLAIM_SECRET?.trim() ?? "";

  if (lilBinToken) {
    return {
      configured: true,
      token: lilBinToken,
      envKey: "LILBIN_CONTROL_TOKEN",
    } as const;
  }

  if (fallbackToken) {
    return {
      configured: true,
      token: fallbackToken,
      envKey: "ADMIN_CLAIM_SECRET",
    } as const;
  }

  return {
    configured: false,
    token: "",
    envKey: null,
  } as const;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function extractBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function extractControlToken(request: Request): { token: string; source: ControlTokenSource | null } {
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    return { token: bearerToken, source: "authorization" };
  }

  const headerToken = request.headers.get(CONTROL_TOKEN_HEADER)?.trim() ?? "";
  if (headerToken) {
    return { token: headerToken, source: CONTROL_TOKEN_HEADER };
  }

  const queryToken = new URL(request.url).searchParams.get(CONTROL_TOKEN_QUERY_PARAM)?.trim() ?? "";
  if (queryToken) {
    return { token: queryToken, source: CONTROL_TOKEN_QUERY_PARAM };
  }

  return { token: "", source: null };
}

export async function requireInternalControl(request: Request): Promise<ControlAuthSuccess | ControlAuthFailure> {
  const config = getInternalControlConfig();
  if (!config.configured) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Internal control token is not configured on the server.",
          expected_env: "LILBIN_CONTROL_TOKEN",
        },
        { status: 503 }
      ),
    };
  }

  const { token, source } = extractControlToken(request);
  if (!token || !source || !safeEqual(token, config.token)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          hint: `Send Authorization: Bearer <${config.envKey}> or ${CONTROL_TOKEN_HEADER}: <token>.`,
        },
        { status: 401 }
      ),
    };
  }

  return { ok: true, source };
}

export function getInternalControlAdminClient() {
  return createAdminClient();
}

export function badRequest(message: string, details?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status: 400 });
}

export function methodNotAllowed(allowed: string[]) {
  return NextResponse.json({ error: "Method not allowed", allowed }, { status: 405 });
}

export function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export function normalizeOptionalString(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function normalizeOptionalDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Dates must use YYYY-MM-DD format.");
  }
  return trimmed;
}

export function normalizeOptionalUuid(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    throw new Error("Expected a UUID.");
  }
  return trimmed;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const CONTROL_TOKEN_HEADER_NAME = CONTROL_TOKEN_HEADER;
