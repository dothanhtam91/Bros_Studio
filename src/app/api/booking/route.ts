import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchRealtorFromBooking, findOrCreateCustomerFromBooking } from "@/lib/jobs";
import { getTravelForAddress } from "@/lib/travel";
import { computePricingBreakdown } from "@/lib/pricing";

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
    sq_ft,
    package_id,
    is_airbnb,
    additional_request_fee,
    preferred_shooting_date,
    time_windows,
    notes,
  } = body as {
    customer_name?: string | null;
    email?: string | null;
    phone?: string | null;
    company_name?: string | null;
    realtor_name?: string | null;
    property_address?: string | null;
    listing_title?: string | null;
    service_type?: string | null;
    sq_ft?: number | null;
    package_id?: string | null;
    is_airbnb?: boolean;
    additional_request_fee?: number | null;
    preferred_shooting_date?: string | null;
    time_windows?: string | null;
    notes?: string | null;
  };

  if (!property_address?.trim()) {
    return NextResponse.json({ error: "Property address is required" }, { status: 400 });
  }
  const name = (customer_name ?? "").trim() || "Booking contact";
  const emailTrim = (email ?? "").trim().toLowerCase();
  if (!emailTrim) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { travelFee } = await getTravelForAddress(property_address.trim());
  const additionalNum = Math.max(0, Number(additional_request_fee) || 0);
  const breakdown = computePricingBreakdown({
    packageId: package_id || "2",
    isAirbnb: Boolean(is_airbnb),
    travelFee,
    additionalRequestFee: additionalNum,
  });

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
    notes: notes?.trim() || null,
    sq_ft: sq_ft != null ? Number(sq_ft) : null,
    package_id: package_id || null,
    is_airbnb: Boolean(is_airbnb),
    additional_request_fee: additionalNum,
    time_windows: time_windows?.trim() || null,
    estimated_price: breakdown.total,
  };

  const admin = createAdminClient();
  const matched = await matchRealtorFromBooking(admin, payload);
  let realtorId: string | null = null;
  let customerId: string | null = null;
  let needsReview = false;

  if (matched) {
    realtorId = matched.realtor_id;
  } else {
    const customer = await findOrCreateCustomerFromBooking(admin, payload);
    customerId = customer.id;
    needsReview = true;
  }

  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      source: "website_booking",
      realtor_id: realtorId,
      customer_id: customerId,
      album_id: null,
      property_address: payload.property_address,
      listing_title: payload.listing_title,
      service_type: payload.service_type,
      shooting_date: payload.preferred_shooting_date || null,
      delivery_deadline: null,
      total_price: breakdown.total,
      priority: "normal",
      status: needsReview ? "pending_confirmation" : "new_booking",
      notes: payload.notes,
      booking_submitted_at: new Date().toISOString(),
    })
    .select("id, status, realtor_id, customer_id, album_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("job_timeline_events").insert([
    { job_id: job.id, event_type: "booking_created", message: "Booking created", metadata: { source: "website_booking" } },
    {
      job_id: job.id,
      event_type: "website_booking_submitted",
      message: needsReview
        ? "Website booking submitted; no matching realtor found — needs review"
        : "Website booking submitted and matched to realtor",
      metadata: { needs_review: needsReview },
    },
  ]);

  await admin.from("notifications").insert({
    job_id: job.id,
    realtor_id: realtorId,
    customer_id: customerId,
    type: needsReview ? "unmatched_booking_needs_review" : "new_website_booking",
    title: needsReview ? "Booking could not be matched to an existing realtor" : "New website booking submitted",
    message: `Property: ${payload.property_address}. ${needsReview ? "Confirm shooting to create album." : ""}`,
  });

  return NextResponse.json({
    id: job.id,
    status: job.status,
    message: needsReview
      ? "Your booking has been received. Our team will review and confirm shortly."
      : "Your booking has been received.",
  });
}
