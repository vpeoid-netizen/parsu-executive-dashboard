import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RankContributionPanel } from "@/components/research/rank-contribution-panel";
import { ResearchYearKpis, ResearchYearTables, ResearchYearTrend } from "@/components/research/year-breakdown";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { collegeFullName } from "@/lib/import/normalize";

export default async function UtilizationPage() {
  const rows = await prisma.researchUtilization.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { fiscalYear: "desc" },
  });
  const years = [...new Set(rows.map((row) => row.fiscalYear))];
  const values = Object.fromEntries(years.map((year) => [year, rows.filter((row) => row.fiscalYear === year).length]));
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/research", label: "Research" }, { label: "Utilization" }]} />
      <ModuleHeader
        title="Research Utilization"
        description="Adopted outputs, beneficiary sectors and participating colleges, shown by fiscal year."
      />
      <ResearchYearKpis years={years} label="outputs" values={values} />
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8">
            <ResearchYearTrend
              title="Utilized outputs over time"
              years={years}
              values={values}
              seriesKey="Outputs"
              seriesLabel="Outputs"
            />
          </div>
          <div className="mb-8">
            <RankContributionPanel title="Contribution by academic rank" records={rows} />
          </div>
          <ResearchYearTables
            years={years}
            rows={rows}
            exportName="research-utilization"
            columns={[
              { key: "college", header: "College", accessor: (row) => collegeFullName(row.collegeCode) },
              { key: "product", header: "Product / title", accessor: (row) => row.productName ?? row.researchTitle },
              { key: "beneficiary", header: "Beneficiary", accessor: (row) => row.beneficiary },
            ]}
          />
        </>
      )}
    </div>
  );
}
