import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      address,
      sq_ft,
      property_type,
      preferred_time_windows,
      addons,
      package_id,
      quote_cents,
      contact_name,
      contact_email,
      contact_phone,
      notes,
    } = body;

    if (!address || !contact_name || !contact_email) {
      return NextResponse.json(
        { error: "address, contact_name, and contact_email are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("bookings").insert({
      address,
      sq_ft: sq_ft ?? null,
      property_type: property_type ?? null,
      preferred_time_windows: preferred_time_windows ?? [],
      addons: addons ?? [],
      package_id: package_id ?? null,
      quote_cents: quote_cents ?? null,
      contact_name,
      contact_email,
      contact_phone: contact_phone ?? null,
      notes: notes ?? null,
    }).select("id").single();

    if (error) {
      console.error("Bookings insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optional: send email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "BrosStudio <onboarding@resend.dev>",
          to: [contact_email],
          subject: "We received your shoot request – BrosStudio",
          text: `Hi ${contact_name},\n\nWe received your request for ${address}. We'll confirm your shoot and send a quote shortly.\n\n— BrosStudio`,
        });
      } catch (e) {
        console.warn("Resend send failed:", e);
      }
    }

    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("Bookings API error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
