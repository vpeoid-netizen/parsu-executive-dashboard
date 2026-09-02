import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { EXECUTIVE_CURRENT_YEAR, EXECUTIVE_KPI_YEARS, type HomepageKpiCard } from "@/lib/kpi-years";
import { sortByMfoAndTitle } from "@/lib/performance-display";

const PUBLIC_CACHE: { revalidate: number; tags: string[] } = { revalidate: 300, tags: ["public-data"] };

function toHomepageCard(definition: {
  id: string;
  code: string;
  shortTitle: string;
  groupName: string | null;
  format: string;
  detailsHref: string | null;
  observations: Array<{
    value: number | null;
    sourceNote: string | null;
    period: { label: string } | null;
  }>;
}): HomepageKpiCard | null {
  const observation = definition.observations[0];
  if (!observation) return null;
  return {
    id: definition.id,
    code: definition.code,
    shortTitle: definition.shortTitle,
    groupName: definition.groupName,
    format: definition.format,
    detailsHref: definition.detailsHref,
    value: observation.value,
    periodLabel: observation.period?.label ?? null,
    sourceNote: observation.sourceNote,
  };
}

async function loadPublishedKpis() {
  const definitions = await prisma.metricDefinition.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      observations: {
        where: { status: "PUBLISHED", period: { fiscalYear: EXECUTIVE_CURRENT_YEAR } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { period: true },
      },
    },
  });
  return definitions.map((definition) => ({
    ...definition,
    observation: definition.observations[0] ?? null,
  }));
}

export const getPublishedKpis = unstable_cache(loadPublishedKpis, ["published-kpis"], PUBLIC_CACHE);

export async function getHomepageKpis() {
  const all = await getPublishedKpis();
  return all.filter((item) => item.homepageVisible);
}

async function loadHomepageKpisByYear() {
  const definitions = await prisma.metricDefinition.findMany({
    where: { homepageVisible: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      code: true,
      shortTitle: true,
      groupName: true,
      format: true,
      detailsHref: true,
      observations: {
        where: {
          status: "PUBLISHED",
          period: { fiscalYear: { in: [...EXECUTIVE_KPI_YEARS] } },
        },
        orderBy: { createdAt: "desc" },
        select: {
          value: true,
          sourceNote: true,
          period: { select: { label: true, fiscalYear: true } },
        },
      },
    },
  });
  const byYear: Record<number, HomepageKpiCard[]> = {};
  for (const year of EXECUTIVE_KPI_YEARS) {
    byYear[year] = definitions
      .map((definition) => {
        const yearObservation = definition.observations.find((item) => item.period?.fiscalYear === year);
        return toHomepageCard({ ...definition, observations: yearObservation ? [yearObservation] : [] });
      })
      .filter((item): item is HomepageKpiCard => item !== null);
  }
  return {
    currentYear: EXECUTIVE_CURRENT_YEAR,
    current: byYear[EXECUTIVE_CURRENT_YEAR] ?? [],
    reference: EXECUTIVE_KPI_YEARS.filter((year) => year !== EXECUTIVE_CURRENT_YEAR).map((year) => ({
      year,
      kpis: byYear[year] ?? [],
    })),
  };
}

export const getHomepageKpisByYear = unstable_cache(loadHomepageKpisByYear, ["homepage-kpis-by-year"], PUBLIC_CACHE);

async function loadEnrollmentSeries() {
  const [rows, colleges] = await Promise.all([
    prisma.enrollmentObservation.findMany({
      where: { status: "PUBLISHED" },
      select: {
        headcount: true,
        collegeId: true,
        period: { select: { id: true, label: true, academicYearStart: true, semester: true } },
      },
    }),
    prisma.college.findMany({ select: { id: true, code: true } }),
  ]);
  const collegeCode = Object.fromEntries(colleges.map((item) => [item.id, item.code]));
  const grouped = new Map<string, { label: string; order: string; total: number; byCollege: Record<string, number> }>();
  for (const row of rows) {
    if (!row.period) continue;
    const key = row.period.id;
    const current = grouped.get(key) ?? {
      label: row.period.label,
      order: `${row.period.academicYearStart}-${row.period.semester}`,
      total: 0,
      byCollege: {},
    };
    current.total += row.headcount ?? 0;
    const code = row.collegeId ? collegeCode[row.collegeId] ?? "UNSPECIFIED" : "UNSPECIFIED";
    current.byCollege[code] = (current.byCollege[code] ?? 0) + (row.headcount ?? 0);
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((a, b) => a.order.localeCompare(b.order));
}

export const getEnrollmentSeries = unstable_cache(loadEnrollmentSeries, ["enrollment-series"], PUBLIC_CACHE);

export async function getPerformanceByYear(year?: number) {
  return unstable_cache(
    async () =>
      prisma.performanceObservation.findMany({
        where: { status: "PUBLISHED", ...(year ? { fiscalYear: year } : {}) },
        include: { indicator: true },
        orderBy: [{ fiscalYear: "asc" }, { indicator: { displayOrder: "asc" } }],
      }),
    ["performance-by-year", String(year ?? "all")],
    PUBLIC_CACHE,
  )();
}

async function loadPerformanceByIndicator() {
  const indicators = await prisma.performanceIndicator.findMany({
    select: {
      id: true,
      title: true,
      indicatorType: true,
      programMfo: true,
      displayOrder: true,
      observations: {
        where: { status: "PUBLISHED" },
        orderBy: { fiscalYear: "asc" },
        select: {
          fiscalYear: true,
          targetRaw: true,
          targetValue: true,
          accomplishmentRaw: true,
          accomplishmentValue: true,
          isPartial: true,
          asOfDate: true,
        },
      },
    },
  });
  return sortByMfoAndTitle(indicators.filter((item) => item.observations.length > 0));
}

export const getPerformanceByIndicator = unstable_cache(
  loadPerformanceByIndicator,
  ["performance-by-indicator"],
  PUBLIC_CACHE,
);

async function loadLatestDatasetDates() {
  return prisma.datasetVersion.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 1,
    select: { publishedAt: true },
  });
}

export const latestDatasetDates = unstable_cache(loadLatestDatasetDates, ["latest-dataset-dates"], PUBLIC_CACHE);

export async function requestIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
}
