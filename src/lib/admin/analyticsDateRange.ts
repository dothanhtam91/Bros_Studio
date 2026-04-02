export type AnalyticsPreset = "week" | "month" | "6m" | "year" | "custom";

export type ParsedAnalyticsRange = {
  preset: AnalyticsPreset;
  start: Date;
  end: Date;
  /** Human-readable label, e.g. "Last 7 days" or "Jan 1 – Mar 15, 2025" */
  label: string;
  /** ISO strings for API / jobs table (start inclusive, end inclusive end-of-day) */
  startISO: string;
  endISO: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Parse admin analytics URL search params into an inclusive date range (local calendar).
 */
export function parseAnalyticsRangeFromSearchParams(
  raw: Record<string, string | string[] | undefined>
): ParsedAnalyticsRange {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const presetRaw = (get("range") || "month").toLowerCase();
  const preset: AnalyticsPreset =
    presetRaw === "week" ||
    presetRaw === "month" ||
    presetRaw === "6m" ||
    presetRaw === "year" ||
    presetRaw === "custom"
      ? (presetRaw as AnalyticsPreset)
      : "month";

  const now = new Date();
  let start: Date;
  let end: Date = endOfDay(now);
  let label: string;

  if (preset === "custom") {
    const fromStr = get("from");
    const toStr = get("to");
    start = fromStr
      ? startOfDay(new Date(fromStr + "T12:00:00"))
      : startOfDay(addDays(now, -30));
    end = toStr ? endOfDay(new Date(toStr + "T12:00:00")) : endOfDay(now);
    if (start.getTime() > end.getTime()) {
      const tmpStart = start;
      start = startOfDay(end);
      end = endOfDay(tmpStart);
    }
    label = `${formatShort(start)} – ${formatShort(end)}`;
  } else {
    end = endOfDay(now);
    switch (preset) {
      case "week":
        start = startOfDay(addDays(now, -7));
        label = "Last 7 days";
        break;
      case "month":
        start = startOfDay(addDays(now, -30));
        label = "Last 30 days";
        break;
      case "6m":
        start = startOfDay(addDays(now, -182));
        label = "Last 6 months";
        break;
      case "year":
        start = startOfDay(addDays(now, -365));
        label = "Last 12 months";
        break;
      default:
        start = startOfDay(addDays(now, -30));
        label = "Last 30 days";
    }
  }

  return {
    preset,
    start,
    end,
    label,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

/** YYYY-MM-DD of date in local timezone */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Server-safe: date inputs for analytics custom range (picker initial state). */
export function customRangeDefaults(range: ParsedAnalyticsRange): { from: string; to: string } {
  return {
    from: toDateInputValue(range.start),
    to: toDateInputValue(range.end),
  };
}
