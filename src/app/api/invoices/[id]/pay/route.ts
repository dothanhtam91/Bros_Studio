import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, project_id, amount_cents, status, paid_at, stripe_payment_intent_id")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: project } = await admin.from("projects").select("id, client_id").eq("id", invoice.project_id).single();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: client } = await admin.from("clients").select("id, user_id").eq("id", project.client_id).single();
  if (!client || client.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (invoice.paid_at || invoice.status === "paid") {
    return NextResponse.redirect(new URL(`/project/${invoice.project_id}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Payments not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: invoice.amount_cents,
          product_data: {
            name: "BrosStudio – Photo delivery",
            description: "Project photos and video download",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/project/${invoice.project_id}?paid=1`,
    cancel_url: `${baseUrl}/project/${invoice.project_id}`,
    client_reference_id: invoiceId,
    metadata: { invoice_id: invoiceId, project_id: invoice.project_id },
  });

  return NextResponse.redirect(session.url!);
}
