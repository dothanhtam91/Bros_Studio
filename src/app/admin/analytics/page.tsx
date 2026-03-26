import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AnalyticsRangePicker, customRangeDefaults } from "@/components/admin/AnalyticsRangePicker";
import { parseAnalyticsRangeFromSearchParams } from "@/lib/admin/analyticsDateRange";
import { buildAnalyticsSummary } from "@/lib/admin/analyticsSummary";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const params = await searchParams;
  const range = parseAnalyticsRangeFromSearchParams(params);
  const customDates = customRangeDefaults(range);

  let analyticsLoadError: string | null = null;
  let summary: Awaited<ReturnType<typeof buildAnalyticsSummary>> | null = null;

  const hasServiceRole =
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

  if (!hasServiceRole) {
    analyticsLoadError =
      "Analytics needs SUPABASE_SERVICE_ROLE_KEY on the server (same place as your other secrets—e.g. Vercel → Project → Settings → Environment Variables). It is not the anon key; copy the service_role key from Supabase → Project Settings → API. Redeploy after adding it.";
  } else {
    try {
      const admin = createAdminClient();
      summary = await buildAnalyticsSummary(admin, range);
    } catch (err) {
      console.error("[admin/analytics]", err);
      analyticsLoadError =
        err instanceof Error ? err.message : "Analytics failed to load. Check server logs.";
    }
  }

  return (
    <main className="min-h-screen bg-stone-50/80 pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-stone-500 hover:text-stone-700 transition">
          ← Admin
        </Link>
        <header className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Operational overview and key metrics for jobs, revenue, and delivery performance.
          </p>
        </header>

        <div className="mt-8">
          <AnalyticsRangePicker
            key={`${range.preset}-${range.startISO}-${range.endISO}`}
            preset={range.preset}
            customFrom={range.preset === "custom" ? customDates.from : undefined}
            customTo={range.preset === "custom" ? customDates.to : undefined}
            rangeLabel={range.label}
          />
        </div>

        <AdminAnalytics
          summary={summary}
          loadError={analyticsLoadError}
          range={{ startISO: range.startISO, endISO: range.endISO, label: range.label }}
        />
      </div>
    </main>
  );
}
