import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { PERFORMANCE_FOCUS_YEAR } from "@/lib/performance-display";
import { getEnrollmentSeries, getHomepageKpisByYear, getPerformanceByIndicator, latestDatasetDates } from "@/lib/queries";

async function loadHomepageData() {
  const [
    kpis,
    enrollment,
    performance,
    versions,
    programs,
    faculty,
    staff,
    completions,
    publications,
    utilizations,
    licensureTotals,
    extensionPrograms,
    extensionPartners,
    documents,
  ] = await Promise.all([
    getHomepageKpisByYear(),
    getEnrollmentSeries(),
    getPerformanceByIndicator(),
    latestDatasetDates(),
    prisma.academicProgram.findMany({
      where: { status: "PUBLISHED" },
      select: {
        copcNumber: true,
        accreditable: true,
        accredited: true,
        college: { select: { code: true } },
      },
    }),
    prisma.facultySnapshot.findMany({
      where: { status: "PUBLISHED" },
      select: { total: true, countsJson: true },
    }),
    prisma.staffSnapshot.findMany({
      where: { status: "PUBLISHED" },
      select: { total: true, countsJson: true },
    }),
    prisma.researchCompletion.findMany({
      where: { status: "PUBLISHED", fiscalYear: PERFORMANCE_FOCUS_YEAR },
      select: { fiscalYear: true, authorsJson: true },
    }),
    prisma.researchPublication.findMany({
      where: { status: "PUBLISHED", fiscalYear: PERFORMANCE_FOCUS_YEAR },
      select: { fiscalYear: true, authorsJson: true },
    }),
    prisma.researchUtilization.findMany({
      where: { status: "PUBLISHED", fiscalYear: PERFORMANCE_FOCUS_YEAR },
      select: { fiscalYear: true, authorsJson: true },
    }),
    prisma.licensureObservation.findMany({
      where: { status: "PUBLISHED", isTotalRow: true },
      orderBy: { fiscalYear: "asc" },
      select: { fiscalYear: true, passingRate: true },
    }),
    prisma.extensionProgram.findMany({
      where: { status: "PUBLISHED" },
      select: { programStatus: true },
    }),
    prisma.extensionPartner.findMany({
      where: { status: "PUBLISHED" },
      select: { organizationType: true },
    }),
    prisma.documentRecord.findMany({
      where: { published: true, visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { id: true, title: true, category: true, externalUrl: true },
    }),
  ]);

  return {
    kpis,
    enrollment,
    performance,
    latestPublish: versions[0]?.publishedAt ?? null,
    programs,
    faculty,
    staff,
    completions,
    publications,
    utilizations,
    licensureTotals,
    extensionPrograms,
    extensionPartners,
    documents,
  };
}

export const getHomepageData = unstable_cache(loadHomepageData, ["homepage-data"], {
  revalidate: 300,
  tags: ["public-data"],
});
