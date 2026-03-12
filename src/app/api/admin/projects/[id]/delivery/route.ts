import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, address, client_id, drive_folder_url")
    .eq("id", projectId)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: client } = await admin
    .from("clients")
    .select("name, contact_email")
    .eq("id", project.client_id)
    .single();
  const email = client?.contact_email;
  if (!email) return NextResponse.json({ error: "No client email" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const projectUrl = `${baseUrl}/project/${projectId}`;
  const driveText = project.drive_folder_url
    ? `\n\nDownload directly from Google Drive: ${project.drive_folder_url}`
    : "";

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: "BrosStudio <onboarding@resend.dev>",
    to: [email],
    subject: "Your photos are ready – BrosStudio",
    text: `Hi${client?.name ? ` ${client.name}` : ""},\n\nYour photos for ${project.address} are ready.\n\nView project: ${projectUrl}${driveText}\n\n— BrosStudio`,
  });

  await admin
    .from("projects")
    .update({
      delivery_status: "sent",
      delivered_at: new Date().toISOString(),
      status: "delivered",
    })
    .eq("id", projectId);

  return NextResponse.json({ ok: true });
}
