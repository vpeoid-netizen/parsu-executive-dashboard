import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RankContributionPanel } from "@/components/research/rank-contribution-panel";
import { ResearchYearKpis, ResearchYearTables, ResearchYearTrend } from "@/components/research/year-breakdown";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatAuthorNames } from "@/lib/research";

export default async function PublicationsPage() {
  const rows = await prisma.researchPublication.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { fiscalYear: "desc" },
  });
  const years = [...new Set(rows.map((row) => row.fiscalYear))];
  const values = Object.fromEntries(years.map((year) => [year, rows.filter((row) => row.fiscalYear === year).length]));
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/research", label: "Research" }, { label: "Publications" }]} />
      <ModuleHeader
        title="Research Publications"
        description="Each publication is counted once by title and shown by fiscal year. Co-authors are stored on the same record. Journal, DOI and indexing fields remain optional until supplied."
      />
      <ResearchYearKpis years={years} label="titles" values={values} />
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8">
            <ResearchYearTrend
              title="Publications over time"
              period="Unique publication titles"
              years={years}
              values={values}
              seriesKey="Titles"
              seriesLabel="Publication titles"
            />
          </div>
          <div className="mb-8">
            <RankContributionPanel title="Contribution by academic rank" records={rows} />
          </div>
          <ResearchYearTables
            years={years}
            rows={rows}
            exportName="research-publications"
            columns={[
              { key: "title", header: "Title", accessor: (row) => row.publishedTitle },
              { key: "authors", header: "Authors", accessor: (row) => formatAuthorNames(row.authorsJson) },
              { key: "journal", header: "Journal", accessor: (row) => row.journal },
            ]}
          />
        </>
      )}
    </div>
  );
}
