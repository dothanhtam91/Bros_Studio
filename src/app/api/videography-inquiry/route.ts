import { NextResponse } from "next/server";
import { getAdminNotificationRecipients, sendVideographyInquiryEmail } from "@/lib/resend";
import { VIDEOGRAPHY_SERVICE_LABELS } from "@/lib/videographyPackages";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || name.length > 200) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email) || email.length > 320) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!serviceId || !VIDEOGRAPHY_SERVICE_LABELS[serviceId]) {
      return NextResponse.json({ error: "Please select a videography option." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const adminRecipients = getAdminNotificationRecipients();
    const result = await sendVideographyInquiryEmail({
      adminRecipients,
      fromName: name,
      fromEmail: email,
      phone: phone || null,
      serviceLabel: VIDEOGRAPHY_SERVICE_LABELS[serviceId]!,
      serviceId,
      message: message || null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("videography-inquiry:", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
