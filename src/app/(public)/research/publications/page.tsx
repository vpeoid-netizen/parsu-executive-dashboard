import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RankContributionPanel } from "@/components/research/rank-contribution-panel";
import { ResearchYearKpis, ResearchYearTables, ResearchYearTrend } from "@/components/research/year-breakdown";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { getPerformanceByIndicator } from "@/lib/queries";
import { FY2026_AS_OF_LABEL } from "@/lib/reporting-as-of";
import { formatAuthorNames } from "@/lib/research";
import { RESEARCH_TITLES_UPDATE_NOTE, researchCountsFromIndicators, researchYearValues } from "@/lib/research-performance";

export const dynamic = "force-static";
export const revalidate = 300;

export default async function PublicationsPage() {
  const [rows, indicators] = await Promise.all([
    prisma.researchPublication.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { fiscalYear: "desc" },
    }),
    getPerformanceByIndicator(),
  ]);
  const { years, values } = researchYearValues(researchCountsFromIndicators(indicators), "publications", rows);
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/research", label: "Research" }, { label: "Publications" }]} />
      <ModuleHeader
        title="Research Publications"
        description={`Each publication is counted once by title. Counts follow university performance. FY 2026 is year-to-date as of ${FY2026_AS_OF_LABEL}. ${RESEARCH_TITLES_UPDATE_NOTE}`}
      />
      {years.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ResearchYearKpis years={years} label="titles" values={values} />
          <div className="mb-8">
            <ResearchYearTrend
              title="Publications over time"
              period="University performance"
              years={years}
              values={values}
              seriesKey="Titles"
              seriesLabel="Publications"
            />
          </div>
          <div className="mb-8">
            <RankContributionPanel title="Contribution by academic rank" records={rows} />
          </div>
          <p className="mb-6 rounded-2xl bg-gold-soft/70 px-4 py-3 text-sm leading-6 text-navy-800 ring-1 ring-gold/25">
            {RESEARCH_TITLES_UPDATE_NOTE}
          </p>
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
