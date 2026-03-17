import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findOrCreateAlbumForJob,
  createRealtorFromCustomer,
} from "@/lib/jobs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id, realtor_id, customer_id, album_id, property_address, shooting_date")
    .eq("id", id)
    .single();

  if (jobErr || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.album_id) return NextResponse.json({ ok: true, already_confirmed: true });

  try {
    let realtorId: string;
    if (job.realtor_id) {
      realtorId = job.realtor_id;
    } else if (job.customer_id) {
      const { data: customer, error: custErr } = await admin.from("customers").select("id, name, email, phone, company").eq("id", job.customer_id).single();
      if (custErr || !customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      const realtor = await createRealtorFromCustomer(admin, customer);
      realtorId = realtor.id;
      const { error: updateErr } = await admin.from("jobs").update({ realtor_id: realtorId, customer_id: null }).eq("id", id);
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Job has no realtor or customer" }, { status: 400 });
    }

    const album = await findOrCreateAlbumForJob(
      admin,
      realtorId,
      job.property_address,
      job.shooting_date
    );

    const now = new Date().toISOString();
    const { error: jobUpdateErr } = await admin
      .from("jobs")
      .update({
        album_id: album.id,
        status: "scheduled",
        confirmed_at: now,
      })
      .eq("id", id);
    if (jobUpdateErr) return NextResponse.json({ error: jobUpdateErr.message }, { status: 400 });

    const { error: albumLinkErr } = await admin.from("albums").update({ job_id: id }).eq("id", album.id);
    if (albumLinkErr) return NextResponse.json({ error: albumLinkErr.message }, { status: 400 });

    const { data: realtor } = await admin.from("realtors").select("slug").eq("id", realtorId).single();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const deliveryUrl = realtor?.slug ? `${baseUrl}/r/${realtor.slug}/${album.slug}` : null;

    await admin.from("job_timeline_events").insert([
      { job_id: id, event_type: "shooting_confirmed", message: "Shooting confirmed", metadata: {} },
      { job_id: id, event_type: "album_created", message: "Album created for property", metadata: { album_id: album.id } },
      { job_id: id, event_type: "album_link_generated", message: deliveryUrl ? "Album link ready" : "Album created", metadata: deliveryUrl ? { delivery_url: deliveryUrl } : {} },
    ]);

    return NextResponse.json({
      ok: true,
      album_id: album.id,
      delivery_url: deliveryUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm shooting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
