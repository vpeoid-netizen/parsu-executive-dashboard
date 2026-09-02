import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyDonutChart, LazyStackedPercentBars } from "@/components/charts/lazy-charts";
import { ACADEMIC_RANK_GROUPS } from "@/lib/import/normalize";
import { formatNumber, formatPercent } from "@/lib/format";
import { contributionByRankAndYear, type AuthoredResearchRecord } from "@/lib/research";

export function RankContributionPanel({
  title,
  records,
  latestNote,
  compact = false,
}: {
  title: string;
  records: AuthoredResearchRecord[];
  latestNote?: string;
  compact?: boolean;
}) {
  const share = contributionByRankAndYear(records);
  if (compact) {
    if (!share.hasData) {
      return <p className="py-6 text-center text-sm text-muted-foreground">Contribution by academic rank is not yet available</p>;
    }
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <LazyDonutChart data={share.latestSlices} />
      </div>
    );
  }
  if (!share.hasData) {
    return (
      <ChartPanel title={title} period="Author contribution by academic rank">
        <p className="py-10 text-center text-sm text-muted-foreground">Data not yet available</p>
      </ChartPanel>
    );
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel
        title={title}
        period={
          share.latestYear
            ? `FY ${share.latestYear} share of author contribution${latestNote ? `. ${latestNote}` : ""}`
            : undefined
        }
      >
        <p className="sr-only">
          Percentage contribution to annual accomplishment by academic rank. Slice labels show percent; the legend
          names each rank.
        </p>
        <LazyDonutChart data={share.latestSlices} />
      </ChartPanel>
      <ChartPanel title="Share by fiscal year" period="100% stacked author contribution">
        <LazyStackedPercentBars data={share.stacked} xKey="year" keys={[...ACADEMIC_RANK_GROUPS]} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Author contribution share by academic rank and fiscal year</caption>
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-3">
                  FY
                </th>
                <th scope="col" className="py-2 pr-3">
                  Academic rank
                </th>
                <th scope="col" className="py-2 pr-3">
                  Weighted contribution
                </th>
                <th scope="col" className="py-2">
                  Share of year
                </th>
              </tr>
            </thead>
            <tbody>
              {share.table.map((row) => (
                <tr key={`${row.year}-${row.rank}`} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2 pr-3 font-semibold text-navy-900">
                    {row.year}
                  </th>
                  <td className="py-2 pr-3">{row.rank}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatNumber(row.contribution, 2)}</td>
                  <td className="py-2 tabular-nums">{formatPercent(row.percent, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartPanel>
    </div>
  );
}
