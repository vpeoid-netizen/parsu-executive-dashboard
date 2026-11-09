import { parseFraction } from "@/lib/metrics";

/** Titles stay on the previous list until Quarter 3 accomplishments are submitted. */
export const RESEARCH_TITLES_UPDATE_NOTE =
  "To be updated after submission of accomplishments for Quarter 3.";

export type ResearchCountKind = "completed" | "publications" | "utilized";

export type ResearchYearCounts = {
  completed: number | null;
  publications: number | null;
  utilized: number | null;
};

export type ResearchPerformanceRow = {
  programMfo: string;
  title: string;
  fiscalYear: number;
  accomplishmentValue: number | null;
  accomplishmentRaw?: string | null;
  numerator?: number | null;
};

const EMPTY_COUNTS: ResearchYearCounts = {
  completed: null,
  publications: null,
  utilized: null,
};

export function researchCountKind(programMfo: string, title: string): ResearchCountKind | null {
  if (!/research program/i.test(programMfo)) return null;
  if (/outputs completed/i.test(title)) return "completed";
  if (/outputs published/i.test(title)) return "publications";
  if (/utilized by the industry|outputs utilized/i.test(title)) return "utilized";
  return null;
}

function countValue(kind: ResearchCountKind, row: ResearchPerformanceRow): number | null {
  if (kind === "publications") {
    if (typeof row.numerator === "number" && !Number.isNaN(row.numerator)) return row.numerator;
    return parseFraction(row.accomplishmentRaw).numerator;
  }
  return typeof row.accomplishmentValue === "number" && !Number.isNaN(row.accomplishmentValue)
    ? row.accomplishmentValue
    : null;
}

export function researchCountsByYear(rows: ResearchPerformanceRow[]): Map<number, ResearchYearCounts> {
  const byYear = new Map<number, ResearchYearCounts>();
  for (const row of rows) {
    const kind = researchCountKind(row.programMfo, row.title);
    if (!kind) continue;
    const value = countValue(kind, row);
    if (value === null) continue;
    const current = byYear.get(row.fiscalYear) ?? { ...EMPTY_COUNTS };
    current[kind] = value;
    byYear.set(row.fiscalYear, current);
  }
  return byYear;
}

export function researchCountsFromIndicators(
  indicators: Array<{
    programMfo: string;
    title: string;
    observations: Array<{
      fiscalYear: number;
      accomplishmentValue: number | null;
      accomplishmentRaw?: string | null;
      numerator?: number | null;
    }>;
  }>,
): Map<number, ResearchYearCounts> {
  return researchCountsByYear(
    indicators.flatMap((indicator) =>
      indicator.observations.map((observation) => ({
        programMfo: indicator.programMfo,
        title: indicator.title,
        fiscalYear: observation.fiscalYear,
        accomplishmentValue: observation.accomplishmentValue,
        accomplishmentRaw: observation.accomplishmentRaw,
        numerator: observation.numerator,
      })),
    ),
  );
}

export function officialResearchCount(
  counts: Map<number, ResearchYearCounts>,
  year: number,
  kind: ResearchCountKind,
  listed: number,
): number {
  const value = counts.get(year)?.[kind];
  return value == null ? listed : value;
}

export function researchYearValues(
  counts: Map<number, ResearchYearCounts>,
  kind: ResearchCountKind,
  rows: Array<{ fiscalYear: number }>,
) {
  const listed: Record<number, number> = {};
  for (const row of rows) listed[row.fiscalYear] = (listed[row.fiscalYear] ?? 0) + 1;
  const years = [...new Set([...counts.keys(), ...Object.keys(listed).map(Number)])].sort((a, b) => b - a);
  const values = Object.fromEntries(
    years.map((year) => [year, officialResearchCount(counts, year, kind, listed[year] ?? 0)]),
  );
  return { years, values };
}
