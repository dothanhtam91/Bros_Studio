import { NextResponse } from "next/server";
import { requireInternalControl } from "@/lib/internal-control";
import { listControlResourceContracts } from "@/lib/internal-control/resources";

export async function GET(request: Request) {
  const auth = await requireInternalControl(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    ok: true,
    auth_source: auth.source,
    endpoint: "/api/internal/control/actions",
    auth: ["Authorization: Bearer <LILBIN_CONTROL_TOKEN>", "x-lilbin-control-token: <LILBIN_CONTROL_TOKEN>"],
    body_shape: {
      action: "<resource>.<operation> or <operation>",
      resource: "required when action is only an operation",
      operation: "list|get|create|update|delete",
      id: "required for get/update/delete; primary key value",
      filters: "optional list filters; allowlisted per resource",
      options: "optional list options: page, limit, sort, q",
      data: "required for create/update; allowlisted fields only",
    },
    resources: listControlResourceContracts(),
  });
}
