"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { AnalyticsPreset, ParsedAnalyticsRange } from "@/lib/admin/analyticsDateRange";
import { toDateInputValue } from "@/lib/admin/analyticsDateRange";

const PRESETS: { id: AnalyticsPreset; label: string }[] = [
  { id: "week", label: "7 days" },
  { id: "month", label: "30 days" },
  { id: "6m", label: "6 months" },
  { id: "year", label: "12 months" },
  { id: "custom", label: "Custom" },
];

type Props = {
  /** Current preset from server (URL) */
  preset: AnalyticsPreset;
  /** Custom range start (only for preset=custom) */
  customFrom?: string;
  customTo?: string;
  /** Display label for the active range */
  rangeLabel: string;
};

export function AnalyticsRangePicker({ preset, customFrom, customTo, rangeLabel }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [localFrom, setLocalFrom] = useState(customFrom ?? "");
  const [localTo, setLocalTo] = useState(customTo ?? "");

  const applyQuery = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `/admin/analytics?${qs}` : "/admin/analytics");
      });
    },
    [router]
  );

  const setPreset = useCallback(
    (p: AnalyticsPreset) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("range", p);
      if (p !== "custom") {
        next.delete("from");
        next.delete("to");
      } else {
        if (!next.get("from") || !next.get("to")) {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 30);
          next.set("from", toDateInputValue(start));
          next.set("to", toDateInputValue(end));
        }
      }
      applyQuery(next);
    },
    [applyQuery, searchParams]
  );

  const applyCustom = useCallback(() => {
    if (!localFrom.trim() || !localTo.trim()) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("range", "custom");
    next.set("from", localFrom);
    next.set("to", localTo);
    applyQuery(next);
  }, [applyQuery, localFrom, localTo, searchParams]);

  const customHint = useMemo(() => {
    if (preset !== "custom") return null;
    return `${customFrom ?? "—"} → ${customTo ?? "—"}`;
  }, [preset, customFrom, customTo]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Reporting period</p>
          <p className="mt-1 text-lg font-semibold text-stone-900">{rangeLabel}</p>
          {customHint && preset === "custom" && (
            <p className="mt-0.5 text-xs text-stone-500">{customHint}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:min-w-[280px]">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreset(id)}
                disabled={isPending}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  preset === id
                    ? "border-amber-300 bg-amber-50 text-stone-900 ring-1 ring-amber-200/80"
                    : "border-stone-200 bg-stone-50/80 text-stone-600 hover:border-stone-300 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex flex-col gap-2 rounded-xl border border-stone-100 bg-stone-50/50 p-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-stone-500">
                Start
                <input
                  type="date"
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm text-stone-900"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-stone-500">
                End
                <input
                  type="date"
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm text-stone-900"
                />
              </label>
              <button
                type="button"
                onClick={applyCustom}
                disabled={isPending || !localFrom || !localTo}
                className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
      {isPending && (
        <p className="mt-3 text-xs text-amber-700/90">Updating analytics…</p>
      )}
    </div>
  );
}

/** Server helper: derive custom YYYY-MM-DD for picker initial state */
export function customRangeDefaults(range: ParsedAnalyticsRange): { from: string; to: string } {
  return {
    from: toDateInputValue(range.start),
    to: toDateInputValue(range.end),
  };
}
