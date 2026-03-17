import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDeliveryEmail } from "@/lib/resend";

/**
 * POST /api/admin/jobs/[id]/send-delivery
 * Sends the completed delivery page link to the customer via Resend.
 * Requires admin auth. Creates delivery_token if missing.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id, realtor_id, customer_id, album_id, property_address, delivery_token")
    .eq("id", id)
    .single();

  if (jobErr || !job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.album_id)
    return NextResponse.json(
      { error: "No album linked. Confirm shooting first." },
      { status: 400 }
    );

  const { data: album } = await admin
    .from("albums")
    .select("id, slug, realtor_id")
    .eq("id", job.album_id)
    .single();
  if (!album)
    return NextResponse.json({ error: "Album not found" }, { status: 404 });

  const { data: realtor } = await admin
    .from("realtors")
    .select("id, slug, name, email")
    .eq("id", album.realtor_id)
    .single();
  const contactEmail = realtor?.email?.trim();
  if (!contactEmail)
    return NextResponse.json(
      { error: "No contact email for this job" },
      { status: 400 }
    );
  if (!realtor?.slug)
    return NextResponse.json(
      { error: "Realtor slug missing" },
      { status: 500 }
    );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let deliveryToken = job.delivery_token;
  if (!deliveryToken) {
    deliveryToken = crypto.randomUUID();
    const { error: tokenErr } = await admin
      .from("jobs")
      .update({ delivery_token: deliveryToken })
      .eq("id", id);
    if (tokenErr)
      return NextResponse.json(
        { error: tokenErr.message },
        { status: 500 }
      );
  }
  const deliveryPageUrl = `${baseUrl}/delivery/${deliveryToken}`;

  const result = await sendDeliveryEmail({
    to: contactEmail,
    recipientName: realtor.name,
    deliveryPageUrl,
    propertyAddress: job.property_address ?? "your property",
    subject: `Your photos are ready – ${job.property_address}`,
  });

  if (!result.ok) {
    const status =
      result.error.includes("not configured") ||
      result.error.includes("RESEND_API_KEY")
        ? 503
        : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  const now = new Date().toISOString();
  await admin
    .from("jobs")
    .update({ delivered_at: now, status: "delivered" })
    .eq("id", id);
  await admin.from("job_timeline_events").insert({
    job_id: id,
    event_type: "delivery_email_sent",
    message: `Delivery link sent to ${contactEmail}`,
    metadata: { to: contactEmail, delivery_page_url: deliveryPageUrl },
  });

  return NextResponse.json({
    ok: true,
    delivered_at: now,
    delivery_page_url: deliveryPageUrl,
  });
}
