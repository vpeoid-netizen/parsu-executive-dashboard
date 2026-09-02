import { NextResponse } from "next/server";
import { getEnrollmentSeries, getHomepageKpisByYear, latestDatasetDates } from "@/lib/queries";

export const revalidate = 300;

export async function GET() {
  const [kpis, enrollment, versions] = await Promise.all([
    getHomepageKpisByYear(),
    getEnrollmentSeries(),
    latestDatasetDates(),
  ]);
  return NextResponse.json({
    updatedAt: versions[0]?.publishedAt ?? null,
    currentYear: kpis.currentYear,
    kpis: kpis.current.map((kpi) => ({
      code: kpi.code,
      title: kpi.shortTitle,
      value: kpi.value,
      format: kpi.format,
      href: kpi.detailsHref,
      note: kpi.sourceNote,
      period: kpi.periodLabel,
    })),
    reference: kpis.reference,
    enrollment,
  });
}
