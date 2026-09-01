export const EXECUTIVE_KPI_YEARS = [2026, 2025, 2024] as const;
export const EXECUTIVE_CURRENT_YEAR = 2026;

export type HomepageKpiCard = {
  id: string;
  code: string;
  shortTitle: string;
  groupName: string | null;
  format: string;
  detailsHref: string | null;
  value: number | null;
  periodLabel: string | null;
  sourceNote: string | null;
};

export function enrollmentPeriodFiscalYear(period: {
  academicYearStart?: number | null;
  semester?: number | null;
}): number | null {
  if (!period.academicYearStart || !period.semester) return null;
  if (period.semester === 2 || period.semester === 3) return period.academicYearStart + 1;
  return period.academicYearStart;
}

export function awardFiscalYear(row: { occurredOn?: Date | string | null; occurredRaw?: string | null }): number | null {
  if (row.occurredOn) {
    const date = typeof row.occurredOn === "string" ? new Date(row.occurredOn) : row.occurredOn;
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year >= 2024 && year <= 2026) return year;
    }
  }
  const match = row.occurredRaw?.match(/\b(2024|2025|2026)\b/);
  return match ? Number(match[1]) : null;
}
