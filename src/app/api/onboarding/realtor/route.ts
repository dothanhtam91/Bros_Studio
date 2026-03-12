import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRealtorFromOnboarding } from "@/lib/realtor-google-auth";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const body = await request.json();
  const { name, phone, brokerage } = body as {
    name?: string | null;
    phone?: string | null;
    brokerage?: string | null;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const { slug } = await createRealtorFromOnboarding(user.id, user.email, {
      name: name.trim(),
      phone: phone?.trim() || null,
      brokerage: brokerage?.trim() || null,
    });
    return NextResponse.json({ slug });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create profile" },
      { status: 400 }
    );
  }
}
