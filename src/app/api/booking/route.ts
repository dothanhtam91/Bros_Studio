import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchRealtorFromBooking, findOrCreateAlbumForJob } from "@/lib/jobs";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    customer_name,
    email,
    phone,
    company_name,
    realtor_name,
    property_address,
    listing_title,
    service_type,
    preferred_shooting_date,
    preferred_delivery_deadline,
    notes,
    estimated_price,
  } = body as {
    customer_name?: string | null;
    email?: string | null;
    phone?: string | null;
    company_name?: string | null;
    realtor_name?: string | null;
    property_address?: string | null;
    listing_title?: string | null;
    service_type?: string | null;
    preferred_shooting_date?: string | null;
    preferred_delivery_deadline?: string | null;
    notes?: string | null;
    estimated_price?: number | null;
  };

  if (!property_address?.trim()) {
    return NextResponse.json({ error: "Property address is required" }, { status: 400 });
  }
  const name = (customer_name ?? "").trim() || "Booking contact";
  const emailTrim = (email ?? "").trim().toLowerCase();
  if (!emailTrim) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const payload = {
    customer_name: name,
    email: emailTrim,
    phone: phone?.trim() || null,
    company_name: company_name?.trim() || null,
    realtor_name: realtor_name?.trim() || null,
    property_address: property_address.trim(),
    listing_title: listing_title?.trim() || null,
    service_type: service_type?.trim() || null,
    preferred_shooting_date: preferred_shooting_date || null,
    preferred_delivery_deadline: preferred_delivery_deadline || null,
    notes: notes?.trim() || null,
    estimated_price: estimated_price != null ? Number(estimated_price) : null,
  };

  const matched = await matchRealtorFromBooking(admin, payload);
  let realtorId: string | null = null;
  let customerId: string | null = null;
  let albumId: string | null = null;
  let needsReview = false;

  if (matched) {
    realtorId = matched.realtor_id;
    const album = await findOrCreateAlbumForJob(
      admin,
      matched.realtor_id,
      payload.property_address,
      payload.preferred_shooting_date || null
    );
    albumId = album.id;
  } else {
    const { data: customer, error: custErr } = await admin
      .from("customers")
      .insert({
        name: payload.customer_name,
        email: payload.email,
        phone: payload.phone,
        company: payload.company_name,
      })
      .select("id")
      .single();
    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });
    customerId = customer.id;
    needsReview = true;
  }

  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      source: "website_booking",
      realtor_id: realtorId,
      customer_id: customerId,
      album_id: albumId,
      property_address: payload.property_address,
      listing_title: payload.listing_title,
      service_type: payload.service_type,
      shooting_date: payload.preferred_shooting_date || null,
      delivery_deadline: payload.preferred_delivery_deadline || null,
      total_price: payload.estimated_price,
      priority: "normal",
      status: needsReview ? "pending_confirmation" : "new_booking",
      notes: payload.notes,
      booking_submitted_at: new Date().toISOString(),
    })
    .select("id, status, realtor_id, customer_id, album_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("job_timeline_events").insert({
    job_id: job.id,
    event_type: "website_booking_submitted",
    message: needsReview
      ? "Website booking submitted; no matching realtor found — needs review"
      : "Website booking submitted and matched to realtor",
    metadata: { needs_review: needsReview },
  });

  if (albumId) {
    await admin.from("albums").update({ job_id: job.id }).eq("id", albumId);
  }

  await admin.from("notifications").insert({
    job_id: job.id,
    realtor_id: realtorId,
    customer_id: customerId,
    type: needsReview ? "unmatched_booking_needs_review" : "new_website_booking",
    title: needsReview ? "Booking could not be matched to an existing realtor" : "New website booking submitted",
    message: `Property: ${payload.property_address}. ${needsReview ? "Please match to a realtor or create one." : ""}`,
  });

  return NextResponse.json({
    id: job.id,
    status: job.status,
    message: needsReview
      ? "Your booking has been received. Our team will review and confirm shortly."
      : "Your booking has been received.",
  });
}
