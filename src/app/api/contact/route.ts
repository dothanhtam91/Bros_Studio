import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "name, email, and message are required" },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "BrosStudio Contact <onboarding@resend.dev>",
        to: [process.env.CONTACT_EMAIL || "hello@example.com"],
        replyTo: email,
        subject: `Contact from ${name} – BrosStudio`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Contact API error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
