import { formatNumber, formatPercent } from "@/lib/format";
import type { AchievementStatus } from "@/lib/metrics";

export const PERFORMANCE_MFO_ORDER = [
  "Higher Education Program",
  "Advanced Education Program",
  "Research Program",
  "Technical Advisory Extension Program",
] as const;

export type PerformanceYearRow = {
  fiscalYear: number;
  targetRaw: string | null;
  targetValue: number | null;
  accomplishmentRaw: string | null;
  accomplishmentValue: number | null;
  isPartial: boolean;
  asOfDate?: Date | string | null;
};

export const PERFORMANCE_FOCUS_YEAR = 2026;

export function partitionPerformanceYears(rows: PerformanceYearRow[], focusYear = PERFORMANCE_FOCUS_YEAR) {
  const years = rows.map((row) => row.fiscalYear);
  const current = years.includes(focusYear) ? focusYear : years.length ? Math.max(...years) : focusYear;
  const focus = rows.find((row) => row.fiscalYear === current) ?? null;
  const historical = rows
    .filter((row) => row.fiscalYear !== current)
    .sort((a, b) => b.fiscalYear - a.fiscalYear);
  return { focusYear: current, focus, historical };
}

export function slugifyMfo(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const EMPLOYABILITY_INDICATOR_TITLE =
  "2. Percentage of graduates (2 yrs prior) that are employed";

export function indicatorAnchorId(title: string) {
  return `indicator-${slugifyMfo(title)}`;
}

export function groupByProgramMfo<T extends { programMfo: string }>(items: T[]) {
  const grouped: Array<{ programMfo: string; items: T[] }> = PERFORMANCE_MFO_ORDER.map((programMfo) => ({
    programMfo,
    items: items.filter((item) => item.programMfo === programMfo),
  })).filter((group) => group.items.length > 0);
  const other = items.filter(
    (item) => !PERFORMANCE_MFO_ORDER.includes(item.programMfo as (typeof PERFORMANCE_MFO_ORDER)[number]),
  );
  if (other.length) grouped.push({ programMfo: "Other programs", items: other });
  return grouped;
}

export function sortByMfoAndTitle<T extends { programMfo: string; title: string; indicatorType?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aIndex = PERFORMANCE_MFO_ORDER.indexOf(a.programMfo as (typeof PERFORMANCE_MFO_ORDER)[number]);
    const bIndex = PERFORMANCE_MFO_ORDER.indexOf(b.programMfo as (typeof PERFORMANCE_MFO_ORDER)[number]);
    const aOrder = aIndex === -1 ? PERFORMANCE_MFO_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? PERFORMANCE_MFO_ORDER.length : bIndex;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const type = (a.indicatorType ?? "").localeCompare(b.indicatorType ?? "", "en");
    if (type !== 0) return type;
    return a.title.localeCompare(b.title, "en");
  });
}

export function isPercentMeasure(title: string, rows: PerformanceYearRow[]) {
  if (/percentage|\bpercent\b|%/i.test(title)) return true;
  const values = rows
    .flatMap((row) => [row.targetValue, row.accomplishmentValue])
    .filter((value): value is number => value !== null && value !== undefined && !Number.isNaN(value));
  return values.length > 0 && values.every((value) => value >= 0 && value <= 1.5);
}

export function toChartNumber(value: number | null | undefined, asPercent: boolean) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (!asPercent) return value;
  if (value > 1 && value <= 100) return Number(value.toFixed(2));
  return Number((value * 100).toFixed(2));
}

export function displayMeasure(raw: string | null | undefined, value: number | null | undefined, asPercent: boolean) {
  const text = raw?.replace(/\s+/g, " ").trim();
  if (asPercent) {
    if (text && /%/.test(text)) return text;
    if (value !== null && value !== undefined && !Number.isNaN(value)) return formatPercent(value);
  }
  if (text) return text;
  if (value === null || value === undefined || Number.isNaN(value)) return "Data not yet available";
  return formatNumber(value, value % 1 === 0 ? 0 : 2);
}

export function yearLabel(fiscalYear: number, isPartial: boolean) {
  return isPartial ? `FY ${fiscalYear}*` : `FY ${fiscalYear}`;
}

export function buildHistoryChart(title: string, rows: PerformanceYearRow[]) {
  const asPercent = isPercentMeasure(title, rows);
  return {
    asPercent,
    unitLabel: asPercent ? "Percent" : "Count",
    points: rows.map((row) => ({
      period: yearLabel(row.fiscalYear, row.isPartial),
      Target: toChartNumber(row.targetValue, asPercent),
      Accomplishment: toChartNumber(row.accomplishmentValue, asPercent),
    })),
  };
}

export function achievementTone(status: AchievementStatus) {
  if (status === "Above Target" || status === "Achieved") return "success" as const;
  if (status === "Near Target") return "warning" as const;
  if (status === "Below Target") return "danger" as const;
  if (status === "Partial Period") return "partial" as const;
  return "neutral" as const;
}
