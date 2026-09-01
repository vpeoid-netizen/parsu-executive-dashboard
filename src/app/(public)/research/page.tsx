import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel, TrendChart } from "@/components/charts/charts";
import { KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";

function countByYear(rows: { fiscalYear: number }[]) {
  const counts: Record<number, number> = {};
  for (const row of rows) {
    counts[row.fiscalYear] = (counts[row.fiscalYear] ?? 0) + 1;
  }
  return counts;
}

export default async function ResearchHomePage() {
  const [completed, publications, utilization, grants] = await Promise.all([
    prisma.researchCompletion.findMany({ where: { status: "PUBLISHED" }, select: { fiscalYear: true } }),
    prisma.researchPublication.findMany({ where: { status: "PUBLISHED" }, select: { fiscalYear: true } }),
    prisma.researchUtilization.findMany({ where: { status: "PUBLISHED" }, select: { fiscalYear: true } }),
    prisma.researchGrant.count({ where: { status: "PUBLISHED" } }),
  ]);
  const completedByYear = countByYear(completed);
  const publicationsByYear = countByYear(publications);
  const utilizationByYear = countByYear(utilization);
  const years = [
    ...new Set([
      ...completed.map((row) => row.fiscalYear),
      ...publications.map((row) => row.fiscalYear),
      ...utilization.map((row) => row.fiscalYear),
    ]),
  ].sort((a, b) => b - a);
  const chronological = [...years].sort((a, b) => a - b);
  const trend = chronological.map((year) => ({
    year: `FY ${year}`,
    Completed: completedByYear[year] ?? 0,
    Publications: publicationsByYear[year] ?? 0,
    Utilization: utilizationByYear[year] ?? 0,
  }));

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Research" }]} />
      <ModuleHeader
        title="Research Analytics"
        description="Completed studies and publications are counted by unique title and shown by fiscal year. Co-authors are not counted as additional records."
      />
      {years.length ? (
        <>
          <div className="mb-8">
            <ChartPanel title="Research accomplishments by fiscal year" period="Unique titles per year">
              <TrendChart
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
                    value={completedByYear[year] ?? 0}
                    href="/research/completed"
                  />
                  <KpiCard title="Publications" value={publicationsByYear[year] ?? 0} href="/research/publications" />
                  <KpiCard title="Utilization" value={utilizationByYear[year] ?? 0} href="/research/utilization" />
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
