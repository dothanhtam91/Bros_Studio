import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ensureAdminForEmail } from "@/lib/admin-claim";
import { findRealtorByUserOrEmail } from "@/lib/realtor-google-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(
      new URL("/login?error=config", request.url)
    );
  }

  const origin = request.nextUrl.origin;
  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((c) => cookiesToSet.push(c));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user.email) await ensureAdminForEmail(user.id, user.email);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let finalUrl: string;

  try {
    if (profile?.role === "admin") {
      finalUrl = `${origin}/admin`;
    } else {
      const realtor = user.email
        ? await findRealtorByUserOrEmail(user.id, user.email)
        : null;
      if (realtor) {
        finalUrl = `${origin}/r/${realtor.slug}`;
      } else if (nextParam === "realtor") {
        finalUrl = `${origin}/onboarding/realtor`;
      } else {
        finalUrl = nextParam.startsWith("/") ? `${origin}${nextParam}` : nextParam;
      }
    }
  } catch {
    finalUrl = nextParam.startsWith("/") ? `${origin}${nextParam}` : nextParam;
  }

  const redirectResponse = NextResponse.redirect(finalUrl);
  cookiesToSet.forEach(({ name, value, options }) =>
    redirectResponse.cookies.set(name, value, options as Record<string, unknown>)
  );
  return redirectResponse;
}
