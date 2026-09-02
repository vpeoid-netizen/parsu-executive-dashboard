"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Building2,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  Handshake,
  Landmark,
  Lightbulb,
  School,
  Target,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { EmptyState, KpiCard } from "@/components/ui/primitives";
import type { HomepageKpiCard } from "@/lib/kpi-years";
import { cn } from "@/lib/utils";

const KPI_ICONS: Record<string, LucideIcon> = {
  CAMPUSES_TOTAL: Building2,
  COLLEGES_TOTAL: Landmark,
  ACADEMIC_PROGRAMS_TOTAL: GraduationCap,
  FACULTY_TOTAL: Users,
  NTP_TOTAL: UserCog,
  ENROLLMENT_CURRENT: School,
  LICENSURE_PASSING_RATE: ClipboardCheck,
  EMPLOYABILITY_RATE: UserCheck,
  PERFORMANCE_MEETING_TARGET: Target,
  RESEARCH_COMPLETED: FlaskConical,
  RESEARCH_PUBLICATIONS: BookOpen,
  RESEARCH_UTILIZED: Lightbulb,
  EXTENSION_PROGRAMS: Handshake,
};

function iconForKpi(code: string, groupName: string | null): LucideIcon {
  if (KPI_ICONS[code]) return KPI_ICONS[code];
  switch (groupName) {
    case "About ParSU":
      return Building2;
    case "Academics":
      return GraduationCap;
    case "Personnel":
      return Users;
    case "Students":
      return School;
    case "Performance":
      return Target;
    case "Research":
      return FlaskConical;
    case "Extension":
      return Handshake;
    default:
      return Briefcase;
  }
}

export function ExecutiveIndicatorTabs({
  currentYear,
  current,
  reference,
}: {
  currentYear: number;
  current: HomepageKpiCard[];
  reference: { year: number; kpis: HomepageKpiCard[] }[];
}) {
  const [tab, setTab] = useState<"current" | "reference">("current");
  const [referenceYear, setReferenceYear] = useState(reference[0]?.year ?? currentYear - 1);
  const activeReference = reference.find((item) => item.year === referenceYear) ?? reference[0];
  const cards = tab === "current" ? current : (activeReference?.kpis ?? []);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-navy-900">Executive Indicators</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "current"
              ? `FY ${currentYear} as of June 30, 2026. Earlier years are in Reference.`
              : "Complete-year figures for comparison. They are not the current FY 2026 values."}
          </p>
        </div>
        <div role="tablist" aria-label="Executive indicator period" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "current"}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-semibold",
              tab === "current" ? "bg-navy-900 text-white" : "bg-white text-navy-800 ring-1 ring-border hover:bg-muted",
            )}
            onClick={() => setTab("current")}
          >
            FY {currentYear}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "reference"}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-semibold",
              tab === "reference" ? "bg-navy-900 text-white" : "bg-white text-navy-800 ring-1 ring-border hover:bg-muted",
            )}
            onClick={() => setTab("reference")}
          >
            Reference
          </button>
        </div>
      </div>
      {tab === "reference" ? (
        <div role="tablist" aria-label="Historical fiscal year" className="mb-4 flex flex-wrap gap-2">
          {reference.map((item) => (
            <button
              key={item.year}
              type="button"
              role="tab"
              aria-selected={item.year === activeReference?.year}
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-semibold",
                item.year === activeReference?.year
                  ? "bg-gold text-navy-900"
                  : "bg-white text-navy-800 ring-1 ring-border hover:bg-muted",
              )}
              onClick={() => setReferenceYear(item.year)}
            >
              FY {item.year}
            </button>
          ))}
        </div>
      ) : null}
      {cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((kpi) => (
            <KpiCard
              key={`${kpi.code}-${tab}-${tab === "reference" ? activeReference?.year : currentYear}`}
              title={kpi.shortTitle}
              group={kpi.groupName}
              value={kpi.value}
              format={kpi.format}
              href={kpi.detailsHref}
              period={kpi.periodLabel ?? kpi.sourceNote}
              icon={iconForKpi(kpi.code, kpi.groupName)}
              emphasizeValue
            />
          ))}
        </div>
      ) : (
        <EmptyState description="No KPI observations are available yet for this period." />
      )}
    </div>
  );
}
