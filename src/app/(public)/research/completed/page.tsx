import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ResearchYearKpis, ResearchYearTrend } from "@/components/research/year-breakdown";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { getPerformanceByIndicator } from "@/lib/queries";
import { FY2026_AS_OF_LABEL } from "@/lib/reporting-as-of";
import { RESEARCH_TITLES_AWAITING, researchCountsFromIndicators, researchYearValues } from "@/lib/research-performance";

export const dynamic = "force-static";
export const revalidate = 300;

export default async function CompletedResearchPage() {
  const [rows, indicators] = await Promise.all([
    prisma.researchCompletion.findMany({
      where: { status: "PUBLISHED" },
      select: { fiscalYear: true },
    }),
    getPerformanceByIndicator(),
  ]);
  const { years, values } = researchYearValues(researchCountsFromIndicators(indicators), "completed", rows);
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/research", label: "Research" }, { label: "Completed Research" }]} />
      <ModuleHeader
        title="Completed Research"
        description={`Counts follow the university performance indicator for research outputs completed. FY 2026 is year-to-date as of ${FY2026_AS_OF_LABEL}.`}
      />
      {years.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ResearchYearKpis years={years} label="studies" values={values} />
          <div className="mb-8">
            <ResearchYearTrend
              title="Completed research over time"
              period="University performance"
              years={years}
              values={values}
              seriesKey="Studies"
              seriesLabel="Completed research"
            />
          </div>
          <section className="card px-5 py-8">
            <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">Titles</h2>
            <p className="mt-2 text-sm leading-6 text-navy-800">{RESEARCH_TITLES_AWAITING}</p>
          </section>
        </>
      )}
    </div>
  );
}
