import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyComparisonBars } from "@/components/charts/lazy-charts";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatPeso, formatPercent } from "@/lib/format";

export default async function BudgetPage() {
  const rows = await prisma.budgetRecord.findMany({
    where: { status: "PUBLISHED", publiclyPublishable: true },
    orderBy: { fiscalYear: "desc" },
  });
  const latestYear = rows[0]?.fiscalYear;
  const latest = rows.filter((row) => row.fiscalYear === latestYear);
  const budget = latest.reduce((sum, row) => sum + Number(row.budget ?? 0), 0);
  const obligation = latest.reduce((sum, row) => sum + Number(row.obligation ?? 0), 0);
  const disbursement = latest.reduce((sum, row) => sum + Number(row.disbursement ?? 0), 0);
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Budget" }]} />
      <ModuleHeader
        title="Budget Monitoring"
        description="Only records marked publicly publishable are shown. Values are formatted in Philippine pesos."
        period={latestYear ? `FY ${latestYear}` : null}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <article className="card p-5">
          <h3 className="text-sm text-muted-foreground">Budget</h3>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-navy-900">{budget ? formatPeso(budget) : "Data not yet available"}</p>
        </article>
        <article className="card p-5">
          <h3 className="text-sm text-muted-foreground">Obligation</h3>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-navy-900">{obligation ? formatPeso(obligation) : "Data not yet available"}</p>
        </article>
        <article className="card p-5">
          <h3 className="text-sm text-muted-foreground">Utilization</h3>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-navy-900">
            {budget ? formatPercent(obligation / budget) : "Data not yet available"}
          </p>
        </article>
      </div>
      {rows.length === 0 ? (
        <EmptyState description="No publicly publishable budget records are currently available." />
      ) : (
        <>
          <ChartPanel title="Budget vs obligation vs disbursement">
            <LazyComparisonBars
              data={latest.map((row) => ({
                name: row.programPap ?? row.category ?? "Item",
                Budget: Number(row.budget ?? 0),
                Obligation: Number(row.obligation ?? 0),
                Disbursement: Number(row.disbursement ?? 0),
              }))}
              xKey="name"
              bars={[
                { key: "Budget", label: "Budget" },
                { key: "Obligation", label: "Obligation" },
                { key: "Disbursement", label: "Disbursement" },
              ]}
            />
          </ChartPanel>
          <div className="mt-8">
            <DataTable
              exportName="budget"
              columns={[
                { key: "year", header: "FY", accessor: (row) => row.fiscalYear },
                { key: "source", header: "Funding source", accessor: (row) => row.fundingSource },
                { key: "pap", header: "PAP / program", accessor: (row) => row.programPap },
                { key: "budget", header: "Budget", accessor: (row) => (row.budget ? formatPeso(Number(row.budget)) : null) },
                { key: "obligation", header: "Obligation", accessor: (row) => (row.obligation ? formatPeso(Number(row.obligation)) : null) },
              ]}
              rows={rows}
            />
          </div>
        </>
      )}
    </div>
  );
}
