/**
 * Resend API integration for sending delivery page links to customers.
 * Requires RESEND_API_KEY in env. Optionally set RESEND_FROM_EMAIL for production.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type SendDeliveryEmailParams = {
  to: string;
  recipientName?: string | null;
  deliveryPageUrl: string;
  propertyAddress: string;
  coverImageUrl?: string | null;
  subject?: string;
};

export type SendDeliveryEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendDeliveryEmail(
  params: SendDeliveryEmailParams
): Promise<SendDeliveryEmailResult> {
  const {
    to,
    recipientName,
    deliveryPageUrl,
    propertyAddress,
    coverImageUrl,
    subject = `Your photos are ready – ${params.propertyAddress}`,
  } = params;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) {
    return {
      ok: false,
      error:
        "Email not configured. Add RESEND_API_KEY to your environment (and RESEND_FROM_EMAIL for production).",
    };
  }

  const fromAddress =
    process.env.RESEND_FROM_EMAIL || "BrosStudio <onboarding@resend.dev>";
  const greeting = recipientName?.trim() ? `Hi ${recipientName.trim()},` : "Hi,";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #18181b;">
  <div style="max-width: 480px; margin: 0 auto; padding: 32px 20px;">
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 18px; font-weight: 600; letter-spacing: -0.02em; color: #292524;">BrosStudio</span>
    </div>
    <div style="background: #ffffff; border-radius: 20px; border: 1px solid rgba(251, 191, 36, 0.35); padding: 32px 28px; box-shadow: 0 1px 3px rgba(120, 53, 15, 0.06);">
      ${coverImageUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${escapeHtml(coverImageUrl)}" alt="Property cover image" style="max-width: 100%; width: 320px; height: 200px; object-fit: cover; border-radius: 12px;" /></div>` : ""}
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #3f3f46;">${greeting}</p>
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #52525b;">Your photos for <strong style="color: #292524;">${escapeHtml(propertyAddress)}</strong> are ready.</p>
      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.5; color: #71717a;">Open your delivery page to view and download your album.</p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
        <tr><td style="text-align: center;">
          <a href="${escapeHtml(deliveryPageUrl)}" style="display: inline-block; background: #b45309; color: #ffffff !important; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.06);">View your photos</a>
        </td></tr>
      </table>
      <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${escapeHtml(deliveryPageUrl)}" style="color: #b45309; word-break: break-all;">${escapeHtml(deliveryPageUrl)}</a></p>
    </div>
    <p style="margin-top: 24px; font-size: 12px; color: #a1a1aa; text-align: center;">Thank you for choosing BrosStudio.</p>
  </div>
</body>
</html>`;

  const text = `${greeting}\n\nYour photos for ${propertyAddress} are ready.\n\nOpen your delivery page: ${deliveryPageUrl}\n\n— BrosStudio`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to.trim()],
      subject,
      html,
      text,
    });

    if (error) {
      return { ok: false, error: error.message || "Failed to send email" };
    }
    return { ok: true, messageId: data?.id ?? "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { ok: false, error: message };
  }
}

/** Recipients for internal notifications (videography inquiries, etc.). */
export function getAdminNotificationRecipients(): string[] {
  const explicit = (process.env.ADMIN_NOTIFICATION_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (explicit.length) return explicit;
  const contact = (process.env.CONTACT_EMAIL ?? "").trim();
  if (contact) return [contact];
  const first = (process.env.BROSTUDIO_FIRST_ADMIN_EMAIL ?? "").trim();
  if (first) return [first];
  const list = (process.env.BROSTUDIO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list;
}

export type SendVideographyInquiryParams = {
  adminRecipients: string[];
  fromName: string;
  fromEmail: string;
  phone?: string | null;
  serviceLabel: string;
  serviceId: string;
  message?: string | null;
};

/**
 * Notify admin(s) when a visitor requests a videography quote from the packages page.
 */
export async function sendVideographyInquiryEmail(
  params: SendVideographyInquiryParams
): Promise<SendDeliveryEmailResult> {
  const { adminRecipients, fromName, fromEmail, phone, serviceLabel, serviceId, message } = params;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) {
    return {
      ok: false,
      error:
        "Email not configured. Add RESEND_API_KEY to your environment (and RESEND_FROM_EMAIL for production).",
    };
  }

  if (!adminRecipients.length) {
    return {
      ok: false,
      error:
        "No admin notification email configured. Set ADMIN_NOTIFICATION_EMAIL, CONTACT_EMAIL, or BROSTUDIO_FIRST_ADMIN_EMAIL.",
    };
  }

  const fromAddress =
    process.env.RESEND_FROM_EMAIL || "BrosStudio <onboarding@resend.dev>";

  const lines = [
    `New videography inquiry from the Packages page`,
    ``,
    `Service: ${serviceLabel} (${serviceId})`,
    `Name: ${fromName}`,
    `Email: ${fromEmail}`,
    phone?.trim() ? `Phone: ${phone.trim()}` : null,
    message?.trim() ? `\nMessage:\n${message.trim()}` : null,
    ``,
    `Reply directly to this email to reach the customer (Reply-To is set).`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#fafaf9; color:#18181b; padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:24px;">
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#292524;">Videography inquiry — BrosStudio</p>
    <table style="width:100%;font-size:14px;line-height:1.6;color:#3f3f46;">
      <tr><td style="padding:4px 0;color:#78716c;width:100px;">Service</td><td>${escapeHtml(serviceLabel)}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Name</td><td>${escapeHtml(fromName)}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Email</td><td><a href="mailto:${escapeHtml(fromEmail)}">${escapeHtml(fromEmail)}</a></td></tr>
      ${phone?.trim() ? `<tr><td style="padding:4px 0;color:#78716c;">Phone</td><td>${escapeHtml(phone.trim())}</td></tr>` : ""}
    </table>
    ${message?.trim() ? `<p style="margin:16px 0 0;font-size:14px;"><strong>Message</strong></p><p style="margin:8px 0 0;font-size:14px;color:#52525b;white-space:pre-wrap;">${escapeHtml(message.trim())}</p>` : ""}
  </div>
</body>
</html>`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: adminRecipients,
      replyTo: fromEmail.trim(),
      subject: `Videography quote request: ${serviceLabel} — ${fromName}`,
      html,
      text: lines,
    });

    if (error) {
      return { ok: false, error: error.message || "Failed to send email" };
    }
    return { ok: true, messageId: data?.id ?? "sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return { ok: false, error: msg };
  }
}
