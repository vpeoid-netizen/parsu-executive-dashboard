import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyComparisonBars, LazyTrendChart } from "@/components/charts/lazy-charts";
import { CollegeAbbrevKey } from "@/components/ui/college-abbrev-key";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatNumber, formatSignedPercent, percentageChange } from "@/lib/format";
import { collegeChartPoint, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";
import { getEnrollmentSeries } from "@/lib/queries";
import { shortChartPeriodLabel } from "@/lib/periods";

export default async function EnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string; semester?: string; campus?: string }>;
}) {
  const params = await searchParams;
  const [rows, series, campuses, colleges] = await Promise.all([
    prisma.enrollmentObservation.findMany({
      where: { status: "PUBLISHED" },
      include: { period: true },
    }),
    getEnrollmentSeries(),
    prisma.campus.findMany(),
    prisma.college.findMany(),
  ]);
  const campusName = Object.fromEntries(campuses.map((item) => [item.id, item.name]));
  const collegeById = Object.fromEntries(colleges.map((item) => [item.id, item]));
  const periods = [...new Map(rows.filter((row) => row.period).map((row) => [row.periodId, row.period!])).values()].sort(
    (a, b) => `${a.academicYearStart}-${a.semester}`.localeCompare(`${b.academicYearStart}-${b.semester}`),
  );
  const latest = periods.at(-1);
  const previous = periods.at(-2);
  const scoped = rows.filter((row) => {
    if (params.campus) {
      const campusFilter = params.campus;
      const campus = campuses.find((item) => item.shortName === campusFilter || item.code === campusFilter.toUpperCase());
      if (campus && row.campusId !== campus.id) return false;
    }
    return true;
  });
  const latestTotal = scoped.filter((row) => row.periodId === latest?.id).reduce((sum, row) => sum + (row.headcount ?? 0), 0);
  const previousTotal = scoped.filter((row) => row.periodId === previous?.id).reduce((sum, row) => sum + (row.headcount ?? 0), 0);
  const change = percentageChange(latestTotal, previousTotal);
  const deltas = new Map<string, { program: string; current: number; previous: number }>();
  if (latest && previous) {
    for (const row of scoped) {
      if (row.periodId !== latest.id && row.periodId !== previous.id) continue;
      const current = deltas.get(row.programName) ?? { program: row.programName, current: 0, previous: 0 };
      if (row.periodId === latest.id) current.current += row.headcount ?? 0;
      if (row.periodId === previous.id) current.previous += row.headcount ?? 0;
      deltas.set(row.programName, current);
    }
  }
  const ranked = [...deltas.values()].map((item) => ({ ...item, delta: item.current - item.previous }));
  const collegeContribution = Object.entries(series.at(-1)?.byCollege ?? {})
    .sort(([a], [b]) => collegeSortIndex(a === "UNSPECIFIED" ? null : a) - collegeSortIndex(b === "UNSPECIFIED" ? null : b))
    .map(([code, value]) => collegeChartPoint(code === "UNSPECIFIED" ? null : code, { Enrollment: value }));

  const collegeIds = [...new Set(scoped.map((row) => row.collegeId ?? "unspecified"))];
  const collegeTrends = collegeIds
    .map((collegeId) => {
      const college = collegeId === "unspecified" ? null : collegeById[collegeId];
      const collegeRows = scoped.filter((row) => (row.collegeId ?? "unspecified") === collegeId);
      const trend = periods.map((period) => ({
        period: shortChartPeriodLabel(period.label),
        Enrollment: collegeRows
          .filter((row) => row.periodId === period.id)
          .reduce((sum, row) => sum + (row.headcount ?? 0), 0),
        fullLabel: period.label,
      }));
      const programs = [...new Map(
        collegeRows.map((row) => {
          const campus = row.campusId ? campusName[row.campusId] ?? "Unspecified" : "Unspecified";
          const key = `${row.programName}::${campus}`;
          return [key, { name: row.programName, campus }] as const;
        }),
      ).values()]
        .sort((a, b) => a.name.localeCompare(b.name) || a.campus.localeCompare(b.campus))
        .map((program, index) => ({
          ...program,
          key: `p${index}`,
          byPeriod: Object.fromEntries(
            periods.map((period) => [
              period.id,
              collegeRows
                .filter(
                  (row) =>
                    row.periodId === period.id &&
                    row.programName === program.name &&
                    (row.campusId ? campusName[row.campusId] ?? "Unspecified" : "Unspecified") === program.campus,
                )
                .reduce((sum, row) => sum + (row.headcount ?? 0), 0),
            ]),
          ),
        }));
      return {
        id: collegeId,
        code: college?.code ?? null,
        title: collegeFullName(college?.code),
        trend,
        programs,
      };
    })
    .sort((a, b) => collegeSortIndex(a.code) - collegeSortIndex(b.code));

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/students", label: "Students" }, { label: "Enrollment" }]} />
      <ModuleHeader
        title="Enrollment"
        description="Semestral enrollment trend by college, with headcount for each program. Percentage change is calculated from valid adjacent observations."
        period={latest?.label}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard title="Latest enrollment" value={latestTotal} period={latest?.label} />
        <KpiCard title="Previous semester" value={previousTotal} period={previous?.label} />
        <article className="card p-5">
          <h3 className="text-sm text-muted-foreground">Change from previous semester</h3>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-navy-900">
            {formatSignedPercent(change) ?? "Data not yet available"}
          </p>
        </article>
      </div>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <ChartPanel title="University trend" period="All semesters">
              <LazyTrendChart
                data={series.map((item) => ({
                  period: shortChartPeriodLabel(item.label),
                  Enrollment: item.total,
                  fullLabel: item.label,
                }))}
                xKey="period"
                series={[{ key: "Enrollment", label: "Enrollment" }]}
              />
            </ChartPanel>
            <ChartPanel title="College contribution" period={latest?.label}>
              <LazyComparisonBars
                data={collegeContribution}
                xKey="name"
                bars={[{ key: "Enrollment", label: "Enrollment" }]}
                horizontal
                categoryWidth={56}
              />
              <CollegeAbbrevKey codes={collegeContribution.map((item) => item.code)} />
            </ChartPanel>
          </div>
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <section className="card p-5">
              <h2 className="text-lg font-semibold tracking-tight">Largest increases</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {ranked
                  .sort((a, b) => b.delta - a.delta)
                  .slice(0, 5)
                  .map((item) => (
                    <li key={item.program}>
                      {item.program}: {formatNumber(item.delta)}
                    </li>
                  ))}
              </ul>
            </section>
            <section className="card p-5">
              <h2 className="text-lg font-semibold tracking-tight">Largest decreases</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {ranked
                  .sort((a, b) => a.delta - b.delta)
                  .slice(0, 5)
                  .map((item) => (
                    <li key={item.program}>
                      {item.program}: {formatNumber(item.delta)}
                    </li>
                  ))}
              </ul>
            </section>
          </div>
          <div className="space-y-6">
            {collegeTrends.map((college) => (
              <ChartPanel key={college.id} title={college.title} period="Enrollment by program">
                <LazyTrendChart
                  data={college.trend}
                  xKey="period"
                  height={260}
                  series={[{ key: "Enrollment", label: "College total" }]}
                />
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <caption className="sr-only">
                      {college.title} enrollment by program and semester
                    </caption>
                    <thead>
                      <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="py-2 pr-3">
                          Program
                        </th>
                        {periods.map((period) => (
                          <th key={period.id} scope="col" className="py-2 pr-3 text-right">
                            {shortChartPeriodLabel(period.label)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {college.programs.map((program) => (
                        <tr key={program.key} className="border-b border-border last:border-0">
                          <th scope="row" className="py-2 pr-3 font-medium text-navy-900">
                            {program.name}
                            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{program.campus}</span>
                          </th>
                          {periods.map((period) => (
                            <td key={period.id} className="py-2 pr-3 text-right tabular-nums">
                              {formatNumber(program.byPeriod[period.id] ?? 0)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
