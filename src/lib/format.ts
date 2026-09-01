import { format } from "date-fns";

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Data not yet available";
  }
  return new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
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
