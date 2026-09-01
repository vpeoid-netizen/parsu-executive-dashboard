import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { EXECUTIVE_CURRENT_YEAR, EXECUTIVE_KPI_YEARS, type HomepageKpiCard } from "@/lib/kpi-years";
import { sortByMfoAndTitle } from "@/lib/performance-display";

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

export async function getPublishedKpis() {
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

export async function getHomepageKpis() {
  const all = await getPublishedKpis();
  return all.filter((item) => item.homepageVisible);
}

export async function getHomepageKpisByYear() {
  const definitions = await prisma.metricDefinition.findMany({
    where: { homepageVisible: true },
    orderBy: { displayOrder: "asc" },
    include: {
      observations: {
        where: { status: "PUBLISHED" },
        include: { period: true },
        orderBy: { createdAt: "desc" },
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

export async function getEnrollmentSeries() {
  const [rows, colleges] = await Promise.all([
    prisma.enrollmentObservation.findMany({
      where: { status: "PUBLISHED" },
      include: { period: true },
    }),
    prisma.college.findMany(),
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

export async function getPerformanceByYear(year?: number) {
  return prisma.performanceObservation.findMany({
    where: { status: "PUBLISHED", ...(year ? { fiscalYear: year } : {}) },
    include: { indicator: true },
    orderBy: [{ fiscalYear: "asc" }, { indicator: { displayOrder: "asc" } }],
  });
}

export async function getPerformanceByIndicator() {
  const indicators = await prisma.performanceIndicator.findMany({
    include: {
      observations: {
        where: { status: "PUBLISHED" },
        orderBy: { fiscalYear: "asc" },
      },
    },
  });
  return sortByMfoAndTitle(indicators.filter((item) => item.observations.length > 0));
}

export async function latestDatasetDates() {
  const versions = await prisma.datasetVersion.findMany({
    where: { status: "PUBLISHED" },
    include: { dataset: true },
    orderBy: { publishedAt: "desc" },
  });
  return versions;
}

export async function requestIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
}
