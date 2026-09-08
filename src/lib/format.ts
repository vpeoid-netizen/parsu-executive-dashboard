import { format } from "date-fns";

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Data not yet available";
  }
  return new Intl.NumberFormat("en-PH", {
    useGrouping: true,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function isCalendarYear(value: number): boolean {
  return Number.isInteger(value) && value >= 1900 && value <= 2099;
}

/** Group digits in published count text (4,353) without rewriting years such as 2026. */
export function formatThousandsInText(text: string): string {
  return text.replace(/(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?/g, (match, intPart: string, frac?: string) => {
    const n = Number(String(intPart).replace(/,/g, ""));
    if (!Number.isFinite(n)) return match;
    if (frac === undefined && isCalendarYear(n)) return match;
    if (Math.abs(n) < 1000 && !String(intPart).includes(",")) {
      return frac !== undefined ? `${n}.${frac}` : String(n);
    }
    const grouped = formatNumber(n, 0);
    return frac !== undefined ? `${grouped}.${frac}` : grouped;
  });
}

export function formatCellValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "—";
    if (isCalendarYear(value)) return String(value);
    return formatNumber(value, value % 1 === 0 ? 0 : 2);
  }
  return formatThousandsInText(String(value));
}

export function formatPercent(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Data not yet available";
  }
  const ratio = value > 1 && value <= 100 ? value / 100 : value;
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatPeso(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Data not yet available";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Data not yet available";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Data not yet available";
  return format(date, "MMMM d, yyyy");
}

export function formatSignedPercent(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function percentageChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0
  ) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}
