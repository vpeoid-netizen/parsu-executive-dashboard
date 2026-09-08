import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyDonutChart } from "@/components/charts/lazy-charts";
import type { DonutSlice } from "@/components/charts/charts";
import { FACULTY_APPOINTMENT_COLORS } from "@/lib/chart-colors";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { ACADEMIC_RANK_GROUPS, collegeAbbrev, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";

type CountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
  education?: Record<string, number>;
};

const APPOINTMENT_GROUPS = ["Permanent", "Temporary", "COS"] as const;

function addCounts(left: CountGroups, right: CountGroups): CountGroups {
  const result: CountGroups = { appointment: {}, rank: {}, education: {} };
  for (const group of ["appointment", "rank", "education"] as const) {
    const keys = new Set([...Object.keys(left[group] ?? {}), ...Object.keys(right[group] ?? {})]);
    for (const key of keys) {
      result[group]![key] = (left[group]?.[key] ?? 0) + (right[group]?.[key] ?? 0);
    }
  }
  return result;
}

function countSlices(
  order: readonly string[],
  counts: Record<string, number> | undefined,
  colors?: Record<string, string>,
): DonutSlice[] {
  return order
    .map((name) => ({ name, value: counts?.[name] ?? 0, color: colors?.[name] }))
    .filter((item) => item.value > 0);
}

export default async function FacultyPage() {
  const [rows, colleges] = await Promise.all([
    prisma.facultySnapshot.findMany({ where: { status: "PUBLISHED" } }),
    prisma.college.findMany(),
  ]);
  const collegeById = Object.fromEntries(colleges.map((item) => [item.id, item]));
  const grouped = new Map<
    string,
    { collegeCode: string | null; college: string; total: number; counts: CountGroups }
  >();
  for (const row of rows) {
    const college = row.collegeId ? collegeById[row.collegeId] : undefined;
    const collegeCode = college?.code ?? null;
    const key = collegeCode ?? "UNSPECIFIED";
    const current = grouped.get(key) ?? {
      collegeCode,
      college: collegeFullName(collegeCode),
      total: 0,
      counts: {},
    };
    current.total += row.total ?? 0;
    current.counts = addCounts(current.counts, JSON.parse(row.countsJson) as CountGroups);
    grouped.set(key, current);
  }
  const parsed = [...grouped.values()].sort((a, b) => collegeSortIndex(a.collegeCode) - collegeSortIndex(b.collegeCode));
  const total = parsed.reduce((sum, row) => sum + row.total, 0);
  const sumBy = (group: "appointment" | "rank" | "education", key: string) =>
    parsed.reduce((sum, row) => sum + (row.counts[group]?.[key] ?? 0), 0);
  const rankSlices = countSlices(ACADEMIC_RANK_GROUPS, Object.fromEntries(ACADEMIC_RANK_GROUPS.map((name) => [name, sumBy("rank", name)])));
  const appointmentSlices = countSlices(
    APPOINTMENT_GROUPS,
    {
      Permanent: sumBy("appointment", "Permanent"),
      Temporary: sumBy("appointment", "Temporary"),
      COS: sumBy("appointment", "COS"),
    },
    FACULTY_APPOINTMENT_COLORS,
  );
  const collegeMix = parsed.filter((row) => row.total > 0);

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/personnel", label: "Personnel" }, { label: "Faculty Members" }]} />
      <ModuleHeader
        title="Faculty Members"
        description="Faculty by college, with appointment, academic rank, and educational background."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total faculty" value={total} />
        <KpiCard title="Permanent" value={sumBy("appointment", "Permanent")} />
        <KpiCard title="Temporary" value={sumBy("appointment", "Temporary")} />
        <KpiCard title="COS" value={sumBy("appointment", "COS")} />
      </div>
      {parsed.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-10 grid gap-6 xl:grid-cols-2">
            <ChartPanel title="Faculty members" period="By academic rank">
              <LazyDonutChart
                data={rankSlices}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(total) }}
              />
            </ChartPanel>
            <ChartPanel title="Faculty members" period="By nature of appointment">
              <LazyDonutChart
                data={appointmentSlices}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(total) }}
              />
            </ChartPanel>
          </div>

          <h2 className="font-display mb-4 text-lg font-semibold tracking-tight text-navy-900">By college</h2>
          <div className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collegeMix.map((row) => (
              <article key={row.collegeCode ?? row.college} className="card min-w-0 overflow-visible p-5">
                <p className="section-kicker">{collegeAbbrev(row.collegeCode)}</p>
                <h3 className="mt-1 text-sm font-semibold leading-snug tracking-tight text-navy-900">{row.college}</h3>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">By academic rank</p>
                    <LazyDonutChart
                      data={countSlices(ACADEMIC_RANK_GROUPS, row.counts.rank)}
                      hideSliceLabels
                      compact
                      centerLabel={{ primary: formatNumber(row.total) }}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">By nature of appointment</p>
                    <LazyDonutChart
                      data={countSlices(APPOINTMENT_GROUPS, row.counts.appointment, FACULTY_APPOINTMENT_COLORS)}
                      hideSliceLabels
                      compact
                      centerLabel={{ primary: formatNumber(row.total) }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h2 className="font-display mb-4 text-lg font-semibold tracking-tight text-navy-900">Summary</h2>
          <DataTable
            exportName="faculty-snapshots"
            columns={[
              { key: "college", header: "College", accessor: (row) => row.college },
              { key: "total", header: "Total", accessor: (row) => row.total },
              { key: "perm", header: "Permanent", accessor: (row) => row.counts.appointment?.Permanent },
              { key: "temp", header: "Temporary", accessor: (row) => row.counts.appointment?.Temporary },
              { key: "cos", header: "COS", accessor: (row) => row.counts.appointment?.COS },
              {
                key: "instructor",
                header: "Instructor",
                accessor: (row) => row.counts.rank?.Instructor,
                hideOnMobile: true,
              },
              {
                key: "asst",
                header: "Asst. Professor",
                accessor: (row) => row.counts.rank?.["Assistant Professor"],
                hideOnMobile: true,
              },
              {
                key: "assoc",
                header: "Assoc. Professor",
                accessor: (row) => row.counts.rank?.["Associate Professor"],
                hideOnMobile: true,
              },
              {
                key: "professor",
                header: "Professor",
                accessor: (row) => row.counts.rank?.Professor,
                hideOnMobile: true,
              },
              {
                key: "univ",
                header: "University Professor",
                accessor: (row) => row.counts.rank?.["University Professor"],
                hideOnMobile: true,
              },
            ]}
            rows={parsed}
          />
        </>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/personnel/non-teaching">Non-teaching personnel</Link>
      </p>
    </div>
  );
}
