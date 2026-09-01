import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RankContributionPanel } from "@/components/research/rank-contribution-panel";
import { ResearchYearKpis, ResearchYearTables, ResearchYearTrend } from "@/components/research/year-breakdown";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatAuthorNames } from "@/lib/research";

export default async function CompletedResearchPage() {
  const rows = await prisma.researchCompletion.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ fiscalYear: "desc" }, { quarter: "asc" }],
  });
  const years = [...new Set(rows.map((row) => row.fiscalYear))];
  const values = Object.fromEntries(years.map((year) => [year, rows.filter((row) => row.fiscalYear === year).length]));
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/research", label: "Research" }, { label: "Completed Research" }]} />
      <ModuleHeader
        title="Completed Research"
        description="Each completed research record is one project title, shown by fiscal year. Multiple authors on the same title are listed together and are not counted as separate studies."
      />
      <ResearchYearKpis years={years} label="studies" values={values} />
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8">
            <ResearchYearTrend
              title="Completed research over time"
              period="Unique project titles"
              years={years}
              values={values}
              seriesKey="Studies"
              seriesLabel="Project titles"
            />
          </div>
          <div className="mb-8">
            <RankContributionPanel
              title="Contribution by academic rank"
              records={rows}
              latestNote="FY 2026 is year-to-date as of June 30, 2026."
            />
          </div>
          <ResearchYearTables
            years={years}
            rows={rows}
            exportName="completed-research"
            columns={[
              { key: "quarter", header: "Quarter", accessor: (row) => row.quarter },
              { key: "title", header: "Title", accessor: (row) => row.title },
              { key: "authors", header: "Authors", accessor: (row) => formatAuthorNames(row.authorsJson), hideOnMobile: true },
            ]}
          />
        </>
      )}
    </div>
  );
}
