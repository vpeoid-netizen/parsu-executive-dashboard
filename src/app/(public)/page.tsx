import Image from "next/image";
import Link from "next/link";
import { ChartPanel, DonutChart, TrendChart } from "@/components/charts/charts";
import { PerformanceIndicatorCard } from "@/components/performance/indicator-card";
import { ExecutiveIndicatorTabs } from "@/components/dashboard/executive-indicator-tabs";
import { DocumentLink } from "@/components/ui/document-link";
import { EmptyState, PageShell, SectionTitle } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { ACADEMIC_RANK_GROUPS } from "@/lib/import/normalize";
import { coverageCenterLabel, hasCopcNumber, programsByCollegeSlices } from "@/lib/program-coverage";
import { PERFORMANCE_FOCUS_YEAR, groupByProgramMfo } from "@/lib/performance-display";
import { shortChartPeriodLabel } from "@/lib/periods";
import { getEnrollmentSeries, getHomepageKpisByYear, getPerformanceByIndicator, latestDatasetDates } from "@/lib/queries";
import { contributionByRankAndYear } from "@/lib/research";

type CountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
};

function sumCountGroup(rows: { total: number | null; countsJson: string }[]) {
  const appointment: Record<string, number> = {};
  const rank: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    total += row.total ?? 0;
    const counts = JSON.parse(row.countsJson) as CountGroups;
    for (const [key, value] of Object.entries(counts.appointment ?? {})) {
      appointment[key] = (appointment[key] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(counts.rank ?? {})) {
      rank[key] = (rank[key] ?? 0) + value;
    }
  }
  return { total, appointment, rank };
}

function researchRankSlices(records: { fiscalYear: number; authorsJson: string }[], fallbackName: string, total: number) {
  const share = contributionByRankAndYear(records);
  if (share.hasData) return share.latestSlices;
  return total > 0 ? [{ name: fallbackName, value: total }] : [];
}

export default async function DashboardPage() {
  const [
    kpis,
    enrollment,
    performance,
    versions,
    programs,
    faculty,
    staff,
    completions,
    publications,
    utilizations,
    licensureTotals,
    extensionPrograms,
    extensionPartners,
    documents,
  ] = await Promise.all([
    getHomepageKpisByYear(),
    getEnrollmentSeries(),
    getPerformanceByIndicator(),
    latestDatasetDates(),
    prisma.academicProgram.findMany({ where: { status: "PUBLISHED" }, include: { college: true } }),
    prisma.facultySnapshot.findMany({ where: { status: "PUBLISHED" } }),
    prisma.staffSnapshot.findMany({ where: { status: "PUBLISHED" } }),
    prisma.researchCompletion.findMany({ where: { status: "PUBLISHED" } }),
    prisma.researchPublication.findMany({ where: { status: "PUBLISHED" } }),
    prisma.researchUtilization.findMany({ where: { status: "PUBLISHED" } }),
    prisma.licensureObservation.findMany({
      where: { status: "PUBLISHED", isTotalRow: true },
      orderBy: { fiscalYear: "asc" },
    }),
    prisma.extensionProgram.findMany({ where: { status: "PUBLISHED" } }),
    prisma.extensionPartner.findMany({ where: { status: "PUBLISHED" } }),
    prisma.documentRecord.findMany({
      where: { published: true, visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  const latestPublish = versions[0]?.publishedAt ?? null;
  const programRows = programs.map((program) => ({
    collegeCode: program.college?.code ?? null,
    copcNumber: program.copcNumber,
    accreditable: program.accreditable,
    accredited: program.accredited,
  }));
  const copcPrograms = programRows.filter((program) => hasCopcNumber(program.copcNumber));
  const accreditablePrograms = programRows.filter((program) => program.accreditable === true);
  const accreditedPrograms = programRows.filter((program) => program.accredited === true);
  const copcSlices = programsByCollegeSlices(copcPrograms);
  const accreditedSlices = programsByCollegeSlices(accreditedPrograms);
  const facultyCounts = sumCountGroup(faculty);
  const staffCounts = sumCountGroup(staff);
  const facultyRankSlices = ACADEMIC_RANK_GROUPS.map((name) => ({
    name,
    value: facultyCounts.rank[name] ?? 0,
  })).filter((item) => item.value > 0);
  const facultyAppointmentSlices = ["Permanent", "Temporary", "COS"].map((name) => ({
    name,
    value: facultyCounts.appointment[name] ?? 0,
  })).filter((item) => item.value > 0);
  const staffAppointmentSlices = ["Permanent", "Casual", "Job Order"].map((name) => ({
    name,
    value: staffCounts.appointment[name] ?? 0,
  })).filter((item) => item.value > 0);
  const performanceGroups = groupByProgramMfo(performance);
  const fyCompletions = completions.filter((row) => row.fiscalYear === PERFORMANCE_FOCUS_YEAR);
  const fyPublications = publications.filter((row) => row.fiscalYear === PERFORMANCE_FOCUS_YEAR);
  const fyUtilizations = utilizations.filter((row) => row.fiscalYear === PERFORMANCE_FOCUS_YEAR);
  const partnerTypeSlices = Object.entries(
    extensionPartners.reduce<Record<string, number>>((acc, partner) => {
      const key = partner.organizationType?.trim() || "Unspecified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
  const programStatusSlices = Object.entries(
    extensionPrograms.reduce<Record<string, number>>((acc, program) => {
      const key = program.programStatus?.trim() || "BOR-approved";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <Image
          src="/hero-campus.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,31,70,0.38)_0%,rgba(7,31,70,0.22)_55%,rgba(7,31,70,0.28)_100%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:px-8 lg:py-16">
          <div className="order-1 mx-auto flex justify-center lg:order-2 lg:mx-0 lg:justify-end">
            <Image
              src="/parsu-logo.png"
              alt="Partido State University official seal"
              width={360}
              height={360}
              className="h-28 w-28 object-contain drop-shadow-[0_12px_28px_rgba(7,31,70,0.45)] sm:h-40 sm:w-40 lg:h-64 lg:w-64"
            />
          </div>
          <div className="order-2 min-w-0 text-center lg:order-1 lg:text-left">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-gold sm:text-[13px]">
              Partido State University
            </p>
            <h1 className="font-display text-[clamp(2.35rem,8vw,5.25rem)] font-bold leading-[0.95] text-white">
              Executive Dashboard
            </h1>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <a href="#executive-indicators" className="btn btn-gold min-h-12 min-w-56 rounded-2xl px-7 text-[15px]">
                Explore indicators
              </a>
              <Link href="/performance" className="btn min-h-12 min-w-56 rounded-2xl border border-white/30 bg-transparent px-7 text-[15px] text-white hover:bg-white/10">
                University performance
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-semibold lg:justify-start">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                Last system update: {latestPublish ? formatDate(latestPublish) : "Data not yet available"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <PageShell>
        <section id="executive-indicators" className="mb-8 scroll-mt-24">
          <ExecutiveIndicatorTabs currentYear={kpis.currentYear} current={kpis.current} reference={kpis.reference} />
        </section>

        <div className="mb-10 grid gap-4 xl:grid-cols-2">
          <ChartPanel
            title="Programs with COPC"
            period="Programs with Certificate of Program Compliance, by college"
            action={{ href: "/academics/programs", label: "View programs" }}
          >
            <p className="sr-only">
              {copcPrograms.length} of {programRows.length} programs have COPC. Slices are college counts.
            </p>
            <DonutChart
              data={copcSlices}
              hideSliceLabels
              centerLabel={coverageCenterLabel(copcPrograms.length, programRows.length)}
            />
          </ChartPanel>
          <ChartPanel
            title="Accreditable programs with active accreditation"
            period="Accreditable programs that are accredited, by college"
            action={{ href: "/academics/programs", label: "View programs" }}
          >
            <p className="sr-only">
              {accreditedPrograms.length} of {accreditablePrograms.length} accreditable programs have active
              accreditation. Slices are college counts.
            </p>
            <DonutChart
              data={accreditedSlices}
              hideSliceLabels
              centerLabel={coverageCenterLabel(accreditedPrograms.length, accreditablePrograms.length)}
            />
          </ChartPanel>
        </div>

        <section id="university-performance" className="mb-10 scroll-mt-24">
          <SectionTitle title="University Performance" action={{ href: "/performance", label: "View details" }} />
          {performanceGroups.length ? (
            <div className="space-y-8">
              {performanceGroups.map((group) => (
                <div key={group.programMfo}>
                  <h3 className="font-display mb-3 text-base font-bold tracking-tight text-navy-900">
                    {group.programMfo}
                  </h3>
                  <div className="grid items-stretch gap-3 md:grid-cols-2">
                    {group.items.map((indicator) => (
                      <PerformanceIndicatorCard
                        key={indicator.id}
                        id={indicator.id}
                        title={indicator.title}
                        indicatorType={indicator.indicatorType}
                        observations={indicator.observations}
                        compact
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>

        <section id="personnel" className="mb-10 scroll-mt-24">
          <SectionTitle title="Personnel" action={{ href: "/personnel", label: "View details" }} />
          <div className="grid gap-4 xl:grid-cols-3">
            <ChartPanel title="Faculty members" period="By academic rank" action={{ href: "/personnel/faculty", label: "Details" }}>
              <DonutChart
                data={facultyRankSlices}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(facultyCounts.total) }}
              />
            </ChartPanel>
            <ChartPanel
              title="Faculty members"
              period="By nature of appointment"
              action={{ href: "/personnel/faculty", label: "Details" }}
            >
              <DonutChart
                data={facultyAppointmentSlices}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(facultyCounts.total) }}
              />
            </ChartPanel>
            <ChartPanel
              title="Non-teaching personnel"
              period="By nature of appointment"
              action={{ href: "/personnel/non-teaching", label: "Details" }}
            >
              <DonutChart
                data={staffAppointmentSlices}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(staffCounts.total) }}
              />
            </ChartPanel>
          </div>
        </section>

        <section id="students" className="mb-10 scroll-mt-24">
          <SectionTitle title="Students" action={{ href: "/students", label: "View details" }} />
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartPanel title="Enrollment" period="Semestral headcount" action={{ href: "/students/enrollment", label: "Details" }}>
              <TrendChart
                data={enrollment.map((row) => ({
                  period: shortChartPeriodLabel(row.label),
                  Enrollment: row.total,
                  fullLabel: row.label,
                }))}
                xKey="period"
                height={260}
                series={[{ key: "Enrollment", label: "Enrollment" }]}
              />
            </ChartPanel>
            <ChartPanel
              title="Licensure examination performance"
              period="First-time taker passing rate"
              action={{ href: "/students/licensure", label: "Details" }}
            >
              <TrendChart
                data={licensureTotals.map((row) => ({
                  year: `FY ${row.fiscalYear}`,
                  Rate: Number(((row.passingRate ?? 0) * 100).toFixed(2)),
                }))}
                xKey="year"
                height={260}
                valueFormat="percent"
                series={[{ key: "Rate", label: "Passing rate (%)" }]}
              />
            </ChartPanel>
          </div>
        </section>

        <section id="research" className="mb-10 scroll-mt-24">
          <SectionTitle title="Research" action={{ href: "/research", label: "View details" }} />
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            Donut colors show percent contribution by academic rank.
          </p>
          <div className="grid gap-4 xl:grid-cols-3">
            <ChartPanel
              title="Completed research"
              period="FY 2026 · Percent contribution by academic rank"
              action={{ href: "/research/completed", label: "Details" }}
            >
              <p className="sr-only">
                Colors in this donut are the percent contribution of each academic rank to completed research.
              </p>
              <DonutChart
                data={researchRankSlices(fyCompletions, "Completed research", fyCompletions.length)}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(fyCompletions.length) }}
              />
            </ChartPanel>
            <ChartPanel
              title="Publication"
              period="FY 2026 · Percent contribution by academic rank"
              action={{ href: "/research/publications", label: "Details" }}
            >
              <p className="sr-only">
                Colors in this donut are the percent contribution of each academic rank to publications.
              </p>
              <DonutChart
                data={researchRankSlices(fyPublications, "Publications", fyPublications.length)}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(fyPublications.length) }}
              />
            </ChartPanel>
            <ChartPanel
              title="Utilization"
              period="FY 2026 · Percent contribution by academic rank"
              action={{ href: "/research/utilization", label: "Details" }}
            >
              <p className="sr-only">
                Colors in this donut are the percent contribution of each academic rank to utilization.
              </p>
              <DonutChart
                data={researchRankSlices(fyUtilizations, "Utilization", fyUtilizations.length)}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(fyUtilizations.length) }}
              />
            </ChartPanel>
          </div>
        </section>

        <section id="extension" className="mb-10 scroll-mt-24">
          <SectionTitle title="Extension" action={{ href: "/extension", label: "View details" }} />
          {extensionPrograms.length || extensionPartners.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {extensionPrograms.length ? (
                <ChartPanel title="BOR-approved programs" period="Published extension programs">
                  <DonutChart data={programStatusSlices} />
                </ChartPanel>
              ) : null}
              {extensionPartners.length ? (
                <ChartPanel title="Extension partners" period="Published partners by type">
                  <DonutChart data={partnerTypeSlices} />
                </ChartPanel>
              ) : null}
            </div>
          ) : (
            <EmptyState description="Extension programs and partners are not yet available." />
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">Institutional documents</h2>
            {documents.length ? (
              <ul className="mt-4 space-y-3">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <DocumentLink
                      title={doc.title}
                      category={doc.category}
                      href={doc.externalUrl ?? "/documents"}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Data not yet available</p>
            )}
          </div>
          <div className="card p-5">
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">Quick links</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ["/academics/programs", "Academic programs"],
                ["/students/enrollment", "Enrollment"],
                ["/performance", "University performance"],
                ["/research", "Research"],
                ["/personnel/faculty", "Faculty"],
                ["/documents", "Documents"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-navy-800">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </PageShell>
    </>
  );
}
