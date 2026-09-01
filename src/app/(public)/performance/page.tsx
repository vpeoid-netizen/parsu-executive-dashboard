import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PerformanceIndicatorCard } from "@/components/performance/indicator-card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import {
  PERFORMANCE_FOCUS_YEAR,
  groupByProgramMfo,
  slugifyMfo,
} from "@/lib/performance-display";
import { classifyAchievement } from "@/lib/metrics";
import { getPerformanceByIndicator } from "@/lib/queries";

export default async function PerformancePage() {
  const indicators = await getPerformanceByIndicator();
  const observations = indicators.flatMap((indicator) =>
    indicator.observations.map((row) => ({ ...row, indicator })),
  );
  const fy2026 = observations.filter((row) => row.fiscalYear === PERFORMANCE_FOCUS_YEAR);
  const withAccomplishment = fy2026.filter(
    (row) => row.accomplishmentValue !== null && row.accomplishmentValue !== undefined,
  ).length;
  const historicalYears = new Set(
    observations.filter((row) => row.fiscalYear !== PERFORMANCE_FOCUS_YEAR).map((row) => row.fiscalYear),
  ).size;
  const grouped = groupByProgramMfo(indicators);
  const tableRows = [...observations].sort((a, b) => {
    if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
    return a.indicator.title.localeCompare(b.indicator.title, "en");
  });

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "University Performance" }]} />
      <ModuleHeader
        title="University Performance"
        description="FY 2026 accomplishment as of June 30, 2026, grouped by major program. FY 2024 and FY 2025 are shown for historical comparison."
        period="FY 2026"
        asOf="June 30, 2026"
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard title="FY 2026 indicators" value={fy2026.length} period="Current reporting year" />
        <KpiCard
          title="FY 2026 with accomplishment"
          value={withAccomplishment}
          period="As of June 30, 2026"
        />
        <KpiCard
          title="Historical complete years"
          value={historicalYears}
          note="FY 2024 and FY 2025"
        />
      </div>
      <p className="mb-8 rounded-2xl bg-gold-soft/70 px-4 py-3 text-sm leading-6 text-navy-800 ring-1 ring-gold/25">
        FY 2026 is year-to-date as of June 30, 2026. It is labelled Partial Period and is not classified as a missed
        annual target.
      </p>
      {indicators.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <nav aria-label="Major programs" className="mb-8 flex flex-wrap gap-2">
            {grouped.map((group) => (
              <a
                key={group.programMfo}
                href={`#${slugifyMfo(group.programMfo)}`}
                className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-navy-800 ring-1 ring-border hover:bg-muted"
              >
                {group.programMfo.replace(/ Program$/, "")}
              </a>
            ))}
          </nav>
          <div className="space-y-12">
            {grouped.map((group) => (
              <section key={group.programMfo} id={slugifyMfo(group.programMfo)} className="scroll-mt-28">
                <p className="section-kicker">Major final output</p>
                <h2 className="font-display mt-2 text-xl font-bold tracking-tight text-navy-900 md:text-2xl">
                  {group.programMfo}
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {group.items.map((indicator) => (
                    <PerformanceIndicatorCard
                      key={indicator.id}
                      id={indicator.id}
                      title={indicator.title}
                      indicatorType={indicator.indicatorType}
                      observations={indicator.observations}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-12">
            <h2 className="font-display mb-1 text-lg font-bold tracking-tight text-navy-900">All figures</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              FY 2026 is listed first. FY 2024 and FY 2025 remain available for export.
            </p>
            <DataTable
              exportName="university-performance"
              columns={[
                { key: "year", header: "FY", accessor: (row) => row.fiscalYear },
                { key: "role", header: "Use", accessor: (row) => (row.fiscalYear === PERFORMANCE_FOCUS_YEAR ? "Current" : "Historical") },
                { key: "mfo", header: "Program / MFO", accessor: (row) => row.indicator.programMfo },
                { key: "type", header: "Type", accessor: (row) => row.indicator.indicatorType, hideOnMobile: true },
                { key: "indicator", header: "Indicator", accessor: (row) => row.indicator.title },
                { key: "target", header: "Target", accessor: (row) => row.targetRaw ?? String(row.targetValue ?? "") },
                {
                  key: "acc",
                  header: "Accomplishment",
                  accessor: (row) => row.accomplishmentRaw ?? String(row.accomplishmentValue ?? ""),
                },
                {
                  key: "status",
                  header: "Status",
                  accessor: (row) =>
                    classifyAchievement({
                      accomplishment: row.accomplishmentValue,
                      target: row.targetValue,
                      isPartial: row.isPartial,
                    }),
                },
              ]}
              rows={tableRows}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Achievement rates for complete years are computed only from normalized numeric values. Partial-year FY 2026
            rows are labelled Partial Period rather than Below Target.
          </p>
        </>
      )}
    </div>
  );
}
