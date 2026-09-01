import { ChartPanel, TrendChart } from "@/components/charts/charts";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/primitives";

export function ResearchYearTrend({
  title,
  period,
  years,
  values,
  seriesKey,
  seriesLabel,
}: {
  title: string;
  period?: string;
  years: number[];
  values: Record<number, number>;
  seriesKey: string;
  seriesLabel: string;
}) {
  const chronological = [...years].sort((a, b) => a - b);
  return (
    <ChartPanel title={title} period={period}>
      <TrendChart
        data={chronological.map((year) => ({
          year: `FY ${year}`,
          [seriesKey]: values[year] ?? 0,
        }))}
        xKey="year"
        series={[{ key: seriesKey, label: seriesLabel }]}
      />
    </ChartPanel>
  );
}

export function ResearchYearKpis({
  years,
  label,
  values,
}: {
  years: number[];
  label: string;
  values: Record<number, number>;
}) {
  const recent = [...years].sort((a, b) => b - a);
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      {recent.map((year) => (
        <KpiCard key={year} title={`FY ${year} ${label}`} value={values[year] ?? 0} />
      ))}
    </div>
  );
}

export function ResearchYearTables<T extends { fiscalYear: number; id?: string }>({
  years,
  rows,
  exportName,
  columns,
  emptyLabel = "No records for this year.",
}: {
  years: number[];
  rows: T[];
  exportName: string;
  columns: Column<T>[];
  emptyLabel?: string;
}) {
  const chronological = [...years].sort((a, b) => b - a);
  return (
    <div className="space-y-8">
      {chronological.map((year) => {
        const yearRows = rows.filter((row) => row.fiscalYear === year);
        return (
          <section key={year} id={`fy-${year}`} className="scroll-mt-28">
            <h2 className="font-display mb-3 text-lg font-semibold tracking-tight text-navy-900">
              FY {year}
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                {yearRows.length} {yearRows.length === 1 ? "record" : "records"}
              </span>
            </h2>
            {yearRows.length ? (
              <DataTable exportName={`${exportName}-fy-${year}`} columns={columns} rows={yearRows} />
            ) : (
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
