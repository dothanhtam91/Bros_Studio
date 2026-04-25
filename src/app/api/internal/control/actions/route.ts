import { NextResponse } from "next/server";
import { getInternalControlAdminClient, requireInternalControl } from "@/lib/internal-control";
import { executeControlAction, parseAction } from "@/lib/internal-control/resources";

function errorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return 400;
}

function errorDetails(error: unknown) {
  if (error && typeof error === "object" && "details" in error) return error.details;
  return undefined;
}

export async function POST(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object." }, { status: 400 });
  }

  try {
    const { operation, resource } = parseAction(body);
    const result = await executeControlAction(getInternalControlAdminClient(), body as Record<string, unknown>);
    return NextResponse.json({
      ok: true,
      auth_source: auth.source,
      routed_action: `${resource}.${operation}`,
      ...result,
    });
  } catch (error) {
    const details = errorDetails(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Control action failed.",
        ...(details ? { details } : {}),
      },
      { status: errorStatus(error) }
    );
  }
}
