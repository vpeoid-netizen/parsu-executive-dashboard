import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyTrendChart } from "@/components/charts/lazy-charts";
import { KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { getPerformanceByIndicator } from "@/lib/queries";
import { FY2026_AS_OF_LABEL } from "@/lib/reporting-as-of";
import { researchCountsFromIndicators, researchYearValues } from "@/lib/research-performance";

export const dynamic = "force-static";
export const revalidate = 300;

export default async function ResearchHomePage() {
  const [completed, publications, utilization, grants, indicators] = await Promise.all([
    prisma.researchCompletion.findMany({ where: { status: "PUBLISHED" }, select: { fiscalYear: true } }),
    prisma.researchPublication.findMany({ where: { status: "PUBLISHED" }, select: { fiscalYear: true } }),
    prisma.researchUtilization.findMany({ where: { status: "PUBLISHED" }, select: { fiscalYear: true } }),
    prisma.researchGrant.count({ where: { status: "PUBLISHED" } }),
    getPerformanceByIndicator(),
  ]);
  const counts = researchCountsFromIndicators(indicators);
  const completedYears = researchYearValues(counts, "completed", completed);
  const publicationYears = researchYearValues(counts, "publications", publications);
  const utilizationYears = researchYearValues(counts, "utilized", utilization);
  const years = [
    ...new Set([...completedYears.years, ...publicationYears.years, ...utilizationYears.years]),
  ].sort((a, b) => b - a);
  const chronological = [...years].sort((a, b) => a - b);
  const trend = chronological.map((year) => ({
    year: `FY ${year}`,
    Completed: completedYears.values[year] ?? 0,
    Publications: publicationYears.values[year] ?? 0,
    Utilization: utilizationYears.values[year] ?? 0,
  }));

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Research" }]} />
      <ModuleHeader
        title="Research Analytics"
        description={`Completed research, publications, and utilization follow the university performance indicators. FY 2026 is year-to-date as of ${FY2026_AS_OF_LABEL}.`}
      />
      {years.length ? (
        <>
          <div className="mb-8">
            <ChartPanel title="Research accomplishments by fiscal year" period="University performance">
              <LazyTrendChart
                data={trend}
                xKey="year"
                series={[
                  { key: "Completed", label: "Completed research" },
                  { key: "Publications", label: "Publications" },
                  { key: "Utilization", label: "Utilization" },
                ]}
              />
            </ChartPanel>
          </div>
          <div className="mb-8">
            <KpiCard title="Approved grants" value={grants} href="/research/grants" />
          </div>
          <div className="space-y-8">
            {years.map((year) => (
              <section key={year}>
                <h2 className="font-display mb-3 text-lg font-semibold tracking-tight text-navy-900">FY {year}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <KpiCard
                    title="Completed research"
                    value={completedYears.values[year] ?? 0}
                    href="/research/completed"
                  />
                  <KpiCard title="Publications" value={publicationYears.values[year] ?? 0} href="/research/publications" />
                  <KpiCard title="Utilization" value={utilizationYears.values[year] ?? 0} href="/research/utilization" />
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Completed research" value={0} href="/research/completed" />
          <KpiCard title="Publications" value={0} href="/research/publications" />
          <KpiCard title="Utilization" value={0} href="/research/utilization" />
          <KpiCard title="Approved grants" value={grants} href="/research/grants" />
        </div>
      )}
    </div>
  );
}
