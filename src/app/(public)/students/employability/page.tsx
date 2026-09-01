import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel, ComparisonBars } from "@/components/charts/charts";
import { CollegeAbbrevKey } from "@/components/ui/college-abbrev-key";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatPercent } from "@/lib/format";
import { collegeChartPoint, collegeFullName, collegeSortIndex, matchCollege } from "@/lib/import/normalize";

export default async function EmployabilityPage() {
  const [rows, colleges] = await Promise.all([
    prisma.employabilityObservation.findMany({ where: { status: "PUBLISHED" } }),
    prisma.college.findMany(),
  ]);
  const collegeCodeById = Object.fromEntries(colleges.map((item) => [item.id, item.code]));
  const displayRows = rows
    .map((row) => {
      const collegeCode = (row.collegeId ? collegeCodeById[row.collegeId] : null) ?? matchCollege(row.collegeName);
      return {
        ...row,
        collegeCode,
        college: collegeCode ? collegeFullName(collegeCode) : row.collegeName,
      };
    })
    .filter((row) => row.collegeCode || !/^colleges?$/i.test(row.college.trim()))
    .sort((a, b) => collegeSortIndex(a.collegeCode) - collegeSortIndex(b.collegeCode));
  const employed = displayRows.reduce((sum, row) => sum + (row.employed ?? 0), 0);
  const graduates = displayRows.reduce((sum, row) => sum + (row.graduates ?? 0), 0);
  const byCollege = displayRows.map((row) =>
    collegeChartPoint(row.collegeCode, { Rate: Number(((row.rate ?? 0) * 100).toFixed(1)) }),
  );
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/students", label: "Students" }, { label: "Employability" }]} />
      <ModuleHeader
        title="Graduate Employability"
        description="College-level tracer figures for graduate employability."
        period={displayRows[0]?.cohortLabel}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard title="University rate" value={graduates ? employed / graduates : null} format="percent" />
        <KpiCard title="Employed graduates" value={employed} />
        <KpiCard title="Graduates in cohort" value={graduates} />
      </div>
      {displayRows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ChartPanel title="College comparison">
            <ComparisonBars
              data={byCollege}
              xKey="name"
              bars={[{ key: "Rate", label: "Employability (%)" }]}
              horizontal
              categoryWidth={56}
            />
            <CollegeAbbrevKey codes={byCollege.map((item) => item.code)} />
          </ChartPanel>
          <div className="mt-8">
            <DataTable
              exportName="employability"
              columns={[
                { key: "college", header: "College", accessor: (row) => row.college },
                { key: "employed", header: "Employed", accessor: (row) => row.employed },
                { key: "graduates", header: "Graduates", accessor: (row) => row.graduates },
                { key: "rate", header: "Rate", accessor: (row) => formatPercent(row.rate) },
                { key: "raw", header: "Source figure", accessor: (row) => row.rawValue },
              ]}
              rows={displayRows}
            />
          </div>
        </>
      )}
    </div>
  );
}
