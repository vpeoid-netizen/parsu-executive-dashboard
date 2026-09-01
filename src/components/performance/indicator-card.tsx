import { TrendChart } from "@/components/charts/charts";
import { StatusBadge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { classifyAchievement } from "@/lib/metrics";
import {
  achievementTone,
  buildHistoryChart,
  displayMeasure,
  indicatorAnchorId,
  partitionPerformanceYears,
  type PerformanceYearRow,
} from "@/lib/performance-display";
import { cn } from "@/lib/utils";

export function PerformanceIndicatorCard({
  id: _id,
  title,
  indicatorType,
  observations,
  compact = false,
}: {
  id: string;
  title: string;
  indicatorType: string;
  observations: PerformanceYearRow[];
  compact?: boolean;
}) {
  const history = buildHistoryChart(title, observations);
  const asPercent = history.asPercent;
  const { focusYear, focus } = partitionPerformanceYears(observations);
  const focusStatus = focus
    ? classifyAchievement({
        accomplishment: focus.accomplishmentValue,
        target: focus.targetValue,
        isPartial: focus.isPartial,
      })
    : null;
  const showStatus = focusStatus && focusStatus !== "Partial Period";
  const asOf =
    focus?.asOfDate && focus.isPartial
      ? formatDate(focus.asOfDate)
      : focus?.isPartial
        ? "June 30, 2026"
        : null;

  return (
    <article
      id={indicatorAnchorId(title)}
      className={cn("card flex h-full flex-col overflow-hidden scroll-mt-28", compact ? "p-4" : "p-5 sm:p-6")}
    >
      <p className="section-kicker">{indicatorType}</p>
      <h3
        className={cn(
          "font-display mt-2 font-semibold leading-snug tracking-tight text-navy-900",
          compact
            ? "min-h-[4.5rem] text-base line-clamp-3 md:text-lg"
            : "min-h-[4.5rem] text-base line-clamp-3 md:text-lg",
        )}
      >
        {title}
      </h3>
      {focus ? (
        <div
          className={cn(
            "mt-3 flex min-h-[6.25rem] flex-col justify-center rounded-2xl bg-gold-soft/80 ring-1 ring-gold/30",
            compact ? "px-3 py-2.5" : "px-4 py-4",
          )}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">
              FY {focusYear} accomplishment
            </p>
            {showStatus ? <StatusBadge label={focusStatus} tone={achievementTone(focusStatus)} /> : null}
          </div>
          <p
            className={cn(
              "font-display mt-1.5 font-bold tabular-nums tracking-tight text-navy-900",
              compact ? "text-xl" : "text-3xl",
            )}
          >
            {displayMeasure(focus.accomplishmentRaw, focus.accomplishmentValue, asPercent)}
          </p>
          <p className={cn("mt-1 text-navy-800", compact ? "text-xs" : "text-sm")}>
            Target: {displayMeasure(focus.targetRaw, focus.targetValue, asPercent)}
          </p>
          {asOf ? <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Year-to-date as of {asOf}</p> : null}
        </div>
      ) : (
        <div className="mt-3 min-h-[6.25rem] rounded-2xl bg-muted/60" />
      )}
      <div className="mt-auto min-w-0 pt-2">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Historical comparison
        </p>
        <p className="sr-only">
          Historical {asPercent ? "percentage" : "count"} of target versus accomplishment. FY {focusYear} is the current
          year; earlier years are shown for comparison.
        </p>
        <TrendChart
          data={history.points}
          xKey="period"
          height={compact ? 220 : 188}
          valueFormat={asPercent ? "percent" : "number"}
          series={[
            { key: "Target", label: "Target", dashed: true, color: "#f7b918" },
            { key: "Accomplishment", label: "Accomplishment", color: "#071f46" },
          ]}
        />
      </div>
    </article>
  );
}
