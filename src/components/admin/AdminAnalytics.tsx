"use client";

import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import Link from "next/link";
import {
  CHART_COLORS,
  AXIS_STYLE,
  TOOLTIP_STYLE,
  CHART_MARGIN,
  BAR_CHART_LAYOUT_MARGIN,
  formatInt,
  formatCurrencyInt,
} from "./analyticsChartConfig";
import { AnalyticsJobsTable, type AnalyticsJobsTableFilters } from "./AnalyticsJobsTable";
import type { AnalyticsSummaryPayload } from "@/lib/admin/analyticsSummary";

type Summary = AnalyticsSummaryPayload | null;

interface AdminAnalyticsProps {
  summary: Summary;
  /** Set when env is wrong or buildAnalyticsSummary throws (e.g. missing service role key). */
  loadError?: string | null;
  range: { startISO: string; endISO: string; label: string };
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}

const statusOrder = [
  "new_booking",
  "pending_confirmation",
  "scheduled",
  "shooting",
  "editing",
  "review",
  "revision_requested",
  "delivered",
  "completed",
  "cancelled",
];

export function AdminAnalytics({ summary, loadError, range }: AdminAnalyticsProps) {
  const [tableFilters, setTableFilters] = useState<AnalyticsJobsTableFilters>({
    status: "",
    source: "",
    realtorId: "",
  });

  const handleFilter = useCallback((updates: Partial<AnalyticsJobsTableFilters>) => {
    setTableFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  if (loadError && !summary) {
    return (
      <div className="mt-10 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-amber-950">Analytics can&apos;t load</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-900/90">{loadError}</p>
        <p className="mt-4 text-xs text-amber-800/80">
          After updating environment variables, trigger a new deployment so the server picks them up.
        </p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-stone-600">Run the unified jobs migration and create jobs to see analytics.</p>
      </div>
    );
  }

  const jobsByStatusData = summary.jobs_by_status
    ? statusOrder
        .filter((st) => (summary.jobs_by_status![st] ?? 0) > 0)
        .map((st) => ({ name: formatStatus(st), count: summary.jobs_by_status![st], statusKey: st }))
    : [];

  const revenueBySourceList = Object.entries(summary.revenue_by_source)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value: Math.round(value), sourceKey: name }))
    .filter((r) => r.value > 0);

  const bookingsByWeek = summary.bookings_by_week ?? [];
  const revenueByWeek = summary.revenue_by_week ?? [];
  const turnaroundByWeek = summary.turnaround_by_week ?? [];
  const jobsOverTimeData = bookingsByWeek.map((w) => ({ ...w, total: w.total ?? w.website + w.admin }));

  return (
    <div className="mt-10 space-y-10">
      {loadError && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm sm:p-5">
          <p className="font-semibold">Partial or fallback data</p>
          <p className="mt-1 leading-relaxed text-amber-900/90">{loadError}</p>
          <p className="mt-2 text-xs text-amber-800/80">
            Charts may show zeros. Check Vercel logs and Supabase migrations (jobs, revision_requests).
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-stone-500">
          Metrics below use <span className="font-medium text-stone-700">{range.label}</span>. Job table is
          filtered by job creation date in the same window.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
          >
            View all jobs
          </Link>
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center justify-center rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-amber-100/90"
          >
            New job
          </Link>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Key metrics</h2>
        <p className="mt-1 text-xs text-stone-500">
          Created / pipeline counts use jobs created in the period. Revenue &amp; turnaround use deliveries in
          the period. Overdue uses deadlines before the end of the period.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Jobs created", value: formatInt(summary.jobs_created_in_period) },
            {
              label: "In progress",
              value: formatInt(summary.in_progress_in_period),
              hint: "Active statuses, created in period",
            },
            { label: "Delivered", value: formatInt(summary.delivered_in_period) },
            {
              label: "Overdue",
              value: formatInt(summary.overdue_as_of_period_end),
              alert: summary.overdue_as_of_period_end > 0,
            },
          ].map((m) => (
            <div
              key={m.label}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${m.alert ? "border-red-200/80 bg-red-50/30" : "border-stone-200"}`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{m.label}</p>
              <p
                className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${m.alert ? "text-red-800" : "text-stone-900"}`}
              >
                {m.value}
              </p>
              {"hint" in m && m.hint ? <p className="mt-1 text-[11px] text-stone-400">{m.hint}</p> : null}
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Avg. turnaround",
              value: summary.average_turnaround_days != null ? `${formatInt(summary.average_turnaround_days)} days` : "—",
              hint: "Delivered in period",
            },
            { label: "Revenue (delivered)", value: formatCurrencyInt(summary.total_revenue) },
            {
              label: "Revision requests",
              value: formatInt(summary.total_revision_requests_in_period),
              hint: "Logged in period",
            },
            {
              label: "New by source",
              value: `${formatInt(summary.website_bookings_in_period)} web`,
              sub: `${formatInt(summary.admin_created_jobs_in_period)} admin`,
            },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{m.label}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900">{m.value}</p>
              {"sub" in m && m.sub ? <p className="mt-0.5 text-sm text-stone-600">{m.sub}</p> : null}
              {"hint" in m && m.hint ? <p className="mt-1 text-[11px] text-stone-400">{m.hint}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Trends</h2>
        <p className="mt-1 text-xs text-stone-500">
          Weekly buckets within <span className="font-medium text-stone-600">{range.label}</span>.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {jobsOverTimeData.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900">Jobs over time</h3>
              <p className="mt-0.5 text-xs text-stone-500">New jobs per week (created in period)</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={jobsOverTimeData} margin={CHART_MARGIN}>
                    <XAxis dataKey="week" {...AXIS_STYLE} />
                    <YAxis tickFormatter={(v) => formatInt(v)} {...AXIS_STYLE} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: unknown) => [formatInt(value), "Jobs"]}
                      labelFormatter={(label) => label}
                    />
                    <Line type="monotone" dataKey="total" name="Jobs" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {revenueByWeek.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900">Revenue over time</h3>
              <p className="mt-0.5 text-xs text-stone-500">Revenue by week of delivery</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueByWeek} margin={CHART_MARGIN}>
                    <XAxis dataKey="week" {...AXIS_STYLE} />
                    <YAxis tickFormatter={(v) => formatInt(v)} {...AXIS_STYLE} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: unknown) => [formatCurrencyInt(value), "Revenue"]}
                      labelFormatter={(label) => label}
                    />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {jobsByStatusData.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900">Jobs by status</h3>
              <p className="mt-0.5 text-xs text-stone-500">Jobs created in period · click a bar to filter table</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobsByStatusData} layout="vertical" margin={BAR_CHART_LAYOUT_MARGIN}>
                    <XAxis type="number" tickFormatter={(v) => formatInt(v)} {...AXIS_STYLE} />
                    <YAxis type="category" dataKey="name" width={72} {...AXIS_STYLE} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: unknown) => [formatInt(value), "Jobs"]}
                      labelFormatter={(label) => label}
                    />
                    <Bar
                      dataKey="count"
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                      name="Jobs"
                      cursor="pointer"
                      onClick={(data: unknown) => {
                        const payload = (data as { payload?: { statusKey?: string } })?.payload;
                        if (payload?.statusKey) handleFilter({ status: payload.statusKey });
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {turnaroundByWeek.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900">Turnaround trend</h3>
              <p className="mt-0.5 text-xs text-stone-500">Avg days to deliver by week of delivery</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={turnaroundByWeek} margin={CHART_MARGIN}>
                    <XAxis dataKey="week" {...AXIS_STYLE} />
                    <YAxis tickFormatter={(v) => formatInt(v)} {...AXIS_STYLE} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: unknown) => [`${formatInt(value)} days`, "Avg turnaround"]}
                      labelFormatter={(label) => label}
                    />
                    <Line type="monotone" dataKey="avgDays" name="Avg days" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {revenueBySourceList.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900">Revenue by source</h3>
            <p className="mt-0.5 text-xs text-stone-500">Delivered in period · click a row to filter the jobs table</p>
            <ul className="mt-4 space-y-2">
              {revenueBySourceList.map((r) => (
                <li key={r.sourceKey}>
                  <button
                    type="button"
                    onClick={() => handleFilter({ source: r.sourceKey })}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-stone-50"
                  >
                    <span className="text-stone-700">{r.name}</span>
                    <span className="tabular-nums font-medium text-stone-900">{formatCurrencyInt(r.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.top_realtors_by_volume && summary.top_realtors_by_volume.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900">Top realtors by volume</h3>
            <p className="mt-0.5 text-xs text-stone-500">Jobs created in period · click a row to filter</p>
            <ul className="mt-4 space-y-1">
              {summary.top_realtors_by_volume.map((r) => (
                <li key={r.realtor_id}>
                  <button
                    type="button"
                    onClick={() => handleFilter({ realtorId: r.realtor_id })}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-stone-50"
                  >
                    <span className="text-stone-700">{r.name}</span>
                    <span className="tabular-nums font-medium text-stone-900">{formatInt(r.count)} jobs</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Jobs</h2>
        <p className="mt-1 text-xs text-stone-500">
          Jobs created between period start and end. Filters from charts apply on top of the date window.
        </p>
        <div className="mt-4">
          <AnalyticsJobsTable
            filters={tableFilters}
            onFiltersChange={setTableFilters}
            createdFrom={range.startISO}
            createdTo={range.endISO}
          />
        </div>
      </section>
    </div>
  );
}
