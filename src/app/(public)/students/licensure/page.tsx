import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyComparisonBars, LazyTrendChart } from "@/components/charts/lazy-charts";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatPercent } from "@/lib/format";
import { EXECUTIVE_CURRENT_YEAR } from "@/lib/kpi-years";

export default async function LicensurePage() {
  const [rows, campuses] = await Promise.all([
    prisma.licensureObservation.findMany({ where: { status: "PUBLISHED" } }),
    prisma.campus.findMany(),
  ]);
  const campusName = Object.fromEntries(campuses.map((item) => [item.id, item.name]));
  const totals = rows.filter((row) => row.isTotalRow).sort((a, b) => a.fiscalYear - b.fiscalYear);
  const detail = rows.filter((row) => !row.isTotalRow);
  const current = totals.find((row) => row.fiscalYear === EXECUTIVE_CURRENT_YEAR) ?? totals.at(-1);
  const currentPeriod = `FY ${EXECUTIVE_CURRENT_YEAR}`;
  const currentAsOf = "June 30, 2026";

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/students", label: "Students" }, { label: "Licensure Examinations" }]} />
      <ModuleHeader
        title="Licensure Examination Performance"
        description="First-time taker results for FY 2026, matching the university performance indicator. FY 2025 university totals follow that same summary. Program rows stay on the detailed licensure worksheet."
        period={currentPeriod}
        asOf={currentAsOf}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="University passing rate"
          value={current?.passingRate ?? null}
          format="percent"
          period={`${currentPeriod} / as of ${currentAsOf}`}
        />
        <KpiCard
          title="First-time takers"
          value={current?.firstTimeTakers ?? null}
          period={`${currentPeriod} / as of ${currentAsOf}`}
        />
        <KpiCard
          title="First-time passers"
          value={current?.firstTimePassers ?? null}
          period={`${currentPeriod} / as of ${currentAsOf}`}
        />
      </div>
      {detail.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <ChartPanel title="Historical first-time passing rate">
              <LazyTrendChart
                data={totals.map((row) => ({
                  year: `FY ${row.fiscalYear}`,
                  Rate: Number(((row.passingRate ?? 0) * 100).toFixed(2)),
                }))}
                xKey="year"
                series={[{ key: "Rate", label: "Passing rate (%)" }]}
              />
            </ChartPanel>
            <ChartPanel title="Program passing rates" period={`${currentPeriod} / as of ${currentAsOf}`}>
              <LazyComparisonBars
                data={detail
                  .filter((row) => row.fiscalYear === current?.fiscalYear && row.passingRate != null)
                  .map((row) => ({
                    name: row.examMonth
                      ? `${row.programName.slice(0, 22)} (${row.examMonth})`
                      : row.programName.slice(0, 28),
                    Rate: Number(((row.passingRate ?? 0) * 100).toFixed(1)),
                  }))}
                xKey="name"
                bars={[{ key: "Rate", label: "Passing rate (%)" }]}
              />
            </ChartPanel>
          </div>
          <DataTable
            exportName="licensure"
            columns={[
              { key: "year", header: "FY", accessor: (row) => row.fiscalYear },
              { key: "campus", header: "Campus", accessor: (row) => (row.campusId ? campusName[row.campusId] : "") },
              { key: "program", header: "Program", accessor: (row) => row.programName },
              { key: "month", header: "Exam", accessor: (row) => row.examMonth },
              { key: "takers", header: "Takers", accessor: (row) => row.firstTimeTakers },
              { key: "passers", header: "Passers", accessor: (row) => row.firstTimePassers },
              { key: "rate", header: "Rate", accessor: (row) => formatPercent(row.passingRate) },
            ]}
            rows={detail}
          />
        </>
      )}
    </div>
  );
}
