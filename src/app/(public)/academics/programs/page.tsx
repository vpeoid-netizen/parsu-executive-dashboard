import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyComparisonBars, LazyDonutChart } from "@/components/charts/lazy-charts";
import { CollegeAbbrevKey } from "@/components/ui/college-abbrev-key";
import { EmptyState, KpiCard, ModuleHeader, StatusBadge } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { collegeAbbrev, collegeChartPoint, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";

function monthsUntil(date: Date | null) {
  if (!date) return null;
  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
}

export default async function ProgramsPage() {
  const programs = await prisma.academicProgram.findMany({
    where: { status: "PUBLISHED" },
    include: { campus: true, college: true },
  });
  programs.sort((a, b) => {
    const collegeCompare = collegeSortIndex(a.college?.code) - collegeSortIndex(b.college?.code);
    if (collegeCompare !== 0) return collegeCompare;
    return a.name.localeCompare(b.name);
  });

  const byCollege = [...new Map(programs.map((item) => [item.college?.code ?? "", item.college])).values()]
    .filter((college): college is NonNullable<typeof college> => Boolean(college))
    .sort((a, b) => collegeSortIndex(a.code) - collegeSortIndex(b.code))
    .map((college) => {
      const count = programs.filter((item) => item.collegeId === college.id).length;
      return collegeChartPoint(college.code, { Programs: count });
    })
    .filter((item) => item.Programs > 0);
  const unspecifiedPrograms = programs.filter((item) => !item.collegeId).length;
  if (unspecifiedPrograms > 0) {
    byCollege.push(collegeChartPoint(null, { Programs: unspecifiedPrograms }));
  }
  const undergraduateCount = programs.filter((item) => /undergraduate/i.test(item.programType ?? "")).length;
  const graduateCount = programs.filter((item) => {
    const type = item.programType ?? "";
    return /graduate/i.test(type) && !/undergraduate/i.test(type);
  }).length;
  const otherTypeCount = programs.length - undergraduateCount - graduateCount;
  const byType = [
    { name: "Undergraduate", value: undergraduateCount },
    { name: "Graduate", value: graduateCount },
    ...(otherTypeCount > 0 ? [{ name: "Other", value: otherTypeCount }] : []),
  ].filter((item) => item.value > 0);
  const expiring = programs.filter((item) => {
    const months = monthsUntil(item.validityEnd);
    return months !== null && months <= 12 && months >= 0;
  });
  const collegeCards = [...new Map(programs.map((item) => [item.college?.id ?? "unspecified", item.college])).values()]
    .sort((a, b) => collegeSortIndex(a?.code) - collegeSortIndex(b?.code))
    .map((college) => ({
      key: college?.id ?? "unspecified",
      code: college?.code ?? null,
      title: college ? collegeFullName(college.code) : "Unspecified college",
      abbrev: college ? collegeAbbrev(college.code) : null,
      programs: programs.filter((item) => (item.collegeId ?? "unspecified") === (college?.id ?? "unspecified")),
    }));
  const phaseOutCount = programs.filter((item) => item.phaseOut).length;

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Academic Programs" }]} />
      <ModuleHeader
        title="Academic Programs"
        description="Program inventory grouped by college, with COPC coverage and accreditation status."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total programs" value={programs.length} />
        <KpiCard title="With COPC / authority" value={programs.filter((item) => item.copcNumber).length} />
        <KpiCard title="Accreditable" value={programs.filter((item) => item.accreditable).length} />
        <KpiCard title="Accredited" value={programs.filter((item) => item.accredited).length} />
      </div>
      {programs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <ChartPanel title="Programs by college">
              <LazyComparisonBars
                data={byCollege}
                xKey="name"
                bars={[{ key: "Programs", label: "Programs" }]}
                horizontal
                categoryWidth={56}
              />
              <CollegeAbbrevKey codes={byCollege.map((item) => item.code)} />
            </ChartPanel>
            <ChartPanel title="Undergraduate vs graduate">
              <p className="sr-only">
                {formatNumber(programs.length)} programs: {undergraduateCount} undergraduate and {graduateCount}{" "}
                graduate{otherTypeCount > 0 ? `, plus ${otherTypeCount} other` : ""}.
              </p>
              <LazyDonutChart
                data={byType}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(programs.length), secondary: "programs" }}
              />
            </ChartPanel>
          </div>
          {expiring.length ? (
            <section className="card my-8 border-warning bg-warning-soft p-5">
              <h2 className="text-lg font-semibold tracking-tight">Accreditation nearing expiration</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {expiring.map((item) => (
                  <li key={item.id}>
                    {item.name} — {item.validityRaw ?? formatDate(item.validityEnd)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="mb-4 text-sm text-muted-foreground">
            Programs marked with an asterisk (*) in the source inventory are for phasing out
            {phaseOutCount ? ` (${phaseOutCount} program${phaseOutCount === 1 ? "" : "s"})` : ""}.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {collegeCards.map((college) => (
              <article key={college.key} className="card flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">{college.title}</h2>
                    {college.abbrev ? <p className="mt-1 text-xs font-semibold text-muted-foreground">{college.abbrev}</p> : null}
                  </div>
                  <p className="font-display text-2xl font-bold tabular-nums text-navy-900">{college.programs.length}</p>
                </div>
                <ul className="mt-4 space-y-3">
                  {college.programs.map((item) => (
                    <li key={item.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-navy-900">
                          {item.name}
                          {item.phaseOut ? <span className="text-warning"> *</span> : null}
                        </p>
                        {item.phaseOut ? <StatusBadge label="Phasing out" tone="warning" /> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {[item.programType, item.campus?.name, item.copcNumber ? `COPC ${item.copcNumber}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {item.accreditationLevel || item.programStatus || item.validityRaw ? (
                        <p className="mt-1 text-xs leading-5 text-navy-800">
                          {item.accreditationLevel ?? item.programStatus}
                          {item.validityRaw ? ` · ${item.validityRaw}` : ""}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Related modules: <Link href="/performance">University performance</Link> ·{" "}
        <Link href="/students/enrollment">Enrollment</Link>
      </p>
    </div>
  );
}
