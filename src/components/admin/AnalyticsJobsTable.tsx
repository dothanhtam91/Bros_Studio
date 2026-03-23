"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrencyInt } from "./analyticsChartConfig";

type JobRow = {
  id: string;
  source: string;
  realtor_id: string | null;
  customer_id: string | null;
  property_address: string;
  shooting_date: string | null;
  delivery_deadline: string | null;
  delivered_at: string | null;
  total_price: number | null;
  status: string;
  created_at: string;
  realtor: { id: string; name: string; email: string | null } | null;
  customer: { id: string; name: string; email: string } | null;
};

const STATUS_BADGES: Record<string, string> = {
  new_booking: "bg-amber-50 text-amber-800 border-amber-200/80",
  pending_confirmation: "bg-stone-100 text-stone-700 border-stone-200",
  scheduled: "bg-sky-50 text-sky-800 border-sky-200/80",
  shooting: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  editing: "bg-violet-50 text-violet-800 border-violet-200/80",
  review: "bg-amber-50 text-amber-800 border-amber-200/80",
  delivered: "bg-stone-100 text-stone-600 border-stone-200",
  revision_requested: "bg-orange-50 text-orange-800 border-orange-200/80",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  cancelled: "bg-stone-100 text-stone-500 border-stone-200",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}

function Turnaround({ created, delivered }: { created: string; delivered: string | null }) {
  if (!delivered) return <span className="text-stone-400">—</span>;
  const days = (new Date(delivered).getTime() - new Date(created).getTime()) / (1000 * 60 * 60 * 24);
  return <span>{Math.round(days)}d</span>;
}

export interface AnalyticsJobsTableFilters {
  status: string;
  source: string;
  realtorId: string;
}

interface AnalyticsJobsTableProps {
  /** When provided, filters are controlled by parent (e.g. click-to-filter from charts). */
  filters?: AnalyticsJobsTableFilters;
  onFiltersChange?: (f: AnalyticsJobsTableFilters) => void;
  /** Limit jobs to those created in this window (ISO strings, inclusive). */
  createdFrom?: string;
  createdTo?: string;
}

export function AnalyticsJobsTable({
  filters,
  onFiltersChange,
  createdFrom,
  createdTo,
}: AnalyticsJobsTableProps) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [internalStatus, setInternalStatus] = useState("");
  const [internalSource, setInternalSource] = useState("");
  const [internalRealtorId, setInternalRealtorId] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 10;

  const isControlled = filters != null && onFiltersChange != null;
  const statusFilter = isControlled ? filters.status : internalStatus;
  const sourceFilter = isControlled ? filters.source : internalSource;
  const realtorIdFilter = isControlled ? filters.realtorId : internalRealtorId;

  const setStatusFilter = (v: string) => {
    if (isControlled) onFiltersChange({ ...filters!, status: v, source: filters!.source, realtorId: filters!.realtorId });
    else setInternalStatus(v);
    setPage(1);
  };
  const setSourceFilter = (v: string) => {
    if (isControlled) onFiltersChange({ ...filters!, status: filters!.status, source: v, realtorId: filters!.realtorId });
    else setInternalSource(v);
    setPage(1);
  };
  const setRealtorIdFilter = (v: string) => {
    if (isControlled) onFiltersChange({ ...filters!, status: filters!.status, source: filters!.source, realtorId: v });
    else setInternalRealtorId(v);
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [createdFrom, createdTo]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    if (realtorIdFilter) params.set("realtor_id", realtorIdFilter);
    if (createdFrom) params.set("from", createdFrom);
    if (createdTo) params.set("to", createdTo);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(limit));
    fetch(`/api/admin/jobs?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [statusFilter, sourceFilter, realtorIdFilter, sort, page, createdFrom, createdTo]);

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = !!(statusFilter || sourceFilter || realtorIdFilter);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setSourceFilter("");
                setRealtorIdFilter("");
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Clear filters
            </button>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
          >
            <option value="">All statuses</option>
            <option value="new_booking">New booking</option>
            <option value="pending_confirmation">Pending confirmation</option>
            <option value="scheduled">Scheduled</option>
            <option value="shooting">Shooting</option>
            <option value="editing">Editing</option>
            <option value="review">Review</option>
            <option value="delivered">Delivered</option>
            <option value="revision_requested">Revision requested</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
          >
            <option value="">All sources</option>
            <option value="website_booking">Website</option>
            <option value="admin_created">Admin</option>
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="deadline">By deadline</option>
            <option value="price_desc">Price (high)</option>
            <option value="price_asc">Price (low)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-500">
            No jobs match the current filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80">
                    <th className="px-4 py-3 font-semibold text-stone-700">Property</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Contact</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Source</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Shoot</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Deadline</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Turnaround</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Price</th>
                    <th className="px-4 py-3 font-semibold text-stone-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {jobs.map((j) => (
                    <tr key={j.id} className="transition hover:bg-stone-50/50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-stone-900">{j.property_address}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {j.realtor?.name ?? j.customer?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                          j.source === "website_booking" ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-600"
                        }`}>
                          {j.source === "website_booking" ? "Web" : "Admin"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[j.status] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}>
                          {formatStatus(j.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {j.shooting_date ? new Date(j.shooting_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {j.delivery_deadline ? new Date(j.delivery_deadline).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-stone-600 tabular-nums">
                        <Turnaround created={j.created_at} delivered={j.delivered_at} />
                      </td>
                      <td className="px-4 py-3 text-stone-700 tabular-nums">
                        {j.total_price != null ? formatCurrencyInt(j.total_price) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/jobs/${j.id}`}
                          className="font-medium text-amber-700 hover:text-amber-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
                <p className="text-sm text-stone-500">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
