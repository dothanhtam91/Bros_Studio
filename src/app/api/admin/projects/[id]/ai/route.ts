import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { type } = body as { type?: "description" | "captions" };
  if (!type || !["description", "captions"].includes(type)) {
    return NextResponse.json({ error: "type must be description or captions" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, address")
    .eq("id", projectId)
    .single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  const prompt =
    type === "description"
      ? `Write a HAR-compliant real estate listing description for: ${project.address}. No fair-housing violations. One paragraph.`
      : `Write 5 short Instagram captions for a luxury real estate listing at ${project.address}.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 502 });
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim() || "";

  await admin.from("ai_results").insert({
    project_id: projectId,
    type: type === "description" ? "description" : "captions",
    payload: { text },
  });

  return NextResponse.json({ text });
}
