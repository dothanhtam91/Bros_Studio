/**
 * Shared analytics chart configuration: Tableau / Power BI / Looker style.
 * All displayed numbers are integers (no decimals).
 */

export const CHART_COLORS = {
  primary: "#b45309",
  primaryLight: "#d97706",
  secondary: "#78716c",
  secondaryLight: "#a8a29e",
  series: ["#b45309", "#78716c", "#92400e", "#57534e", "#a8a29e", "#c4b5a0"],
} as const;

export const AXIS_STYLE = {
  stroke: "#a8a29e",
  fontSize: 11,
  tickLine: false,
} as const;

export const TOOLTIP_STYLE: Record<string, string | number> = {
  borderRadius: "8px",
  border: "1px solid #e7e5e4",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.06)",
  padding: "8px 12px",
  fontSize: "12px",
  backgroundColor: "#fff",
};

/** Format as integer for axis/tooltip (counts, days). */
export function formatInt(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return String(Math.round(n));
}

/** Format currency as integer dollars (no cents). */
export function formatCurrencyInt(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "$0";
  return `$${Math.round(n).toLocaleString()}`;
}

/** Format percentage as integer (e.g. 45 not 44.7). */
export function formatPercentInt(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "0%";
  return `${Math.round(n)}%`;
}

/** Turnaround days as integer. */
export function formatTurnaroundInt(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${Math.round(n)}d`;
}

export const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };
export const BAR_CHART_LAYOUT_MARGIN = { left: 72 };
