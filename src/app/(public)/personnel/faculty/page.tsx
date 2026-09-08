import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel } from "@/components/charts/chart-panel";
import { LazyDonutChart } from "@/components/charts/lazy-charts";
import type { DonutSlice } from "@/components/charts/charts";
import { FACULTY_APPOINTMENT_COLORS, FACULTY_EDUCATION_COLORS } from "@/lib/chart-colors";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { EDUCATION_LEVELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { ACADEMIC_RANK_GROUPS, collegeAbbrev, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";

type CountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
  education?: Record<string, number>;
};

const APPOINTMENT_GROUPS = ["Permanent", "Temporary", "COS"] as const;
const EDUCATION_GROUPS = EDUCATION_LEVELS.map((item) => item.name);

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

function CollegeDonutColumn({
  title,
  data,
  total,
}: {
  title: string;
  data: DonutSlice[];
  total: number;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-3 flex min-h-10 items-end text-xs font-semibold leading-5 text-muted-foreground">{title}</p>
      <LazyDonutChart
        data={data}
        hideSliceLabels
        centerLabel={{ primary: formatNumber(total) }}
      />
    </div>
  );
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
  const educationSlices = countSlices(
    EDUCATION_GROUPS,
    Object.fromEntries(EDUCATION_GROUPS.map((name) => [name, sumBy("education", name)])),
    FACULTY_EDUCATION_COLORS,
  );
  const collegeMix = parsed.filter((row) => row.total > 0);

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/personnel", label: "Personnel" }, { label: "Faculty Members" }]} />
      <ModuleHeader
        title="Faculty Members"
        description="Faculty by college, with nature of appointment, academic rank, and highest educational attainment."
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
          <div className="mb-10 grid gap-6 lg:grid-cols-3">
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
            <ChartPanel title="Faculty members" period="By highest educational attainment">
              <LazyDonutChart
                data={educationSlices}
                hideSliceLabels
                centerLabel={{ primary: formatNumber(total) }}
              />
            </ChartPanel>
          </div>

          <h2 className="font-display mb-4 text-lg font-semibold tracking-tight text-navy-900">By college</h2>
          <div className="mb-10 space-y-4">
            {collegeMix.map((row) => (
              <article key={row.collegeCode ?? row.college} className="card min-w-0 overflow-visible p-5 sm:p-6">
                <p className="section-kicker">{collegeAbbrev(row.collegeCode)}</p>
                <h3 className="mt-1 text-sm font-semibold leading-snug tracking-tight text-navy-900 sm:text-base">
                  {row.college}
                </h3>
                <div className="mt-5 grid items-start gap-x-6 gap-y-8 sm:grid-cols-3">
                  <CollegeDonutColumn
                    title="By academic rank"
                    data={countSlices(ACADEMIC_RANK_GROUPS, row.counts.rank)}
                    total={row.total}
                  />
                  <CollegeDonutColumn
                    title="By nature of appointment"
                    data={countSlices(APPOINTMENT_GROUPS, row.counts.appointment, FACULTY_APPOINTMENT_COLORS)}
                    total={row.total}
                  />
                  <CollegeDonutColumn
                    title="By highest educational attainment"
                    data={countSlices(EDUCATION_GROUPS, row.counts.education, FACULTY_EDUCATION_COLORS)}
                    total={row.total}
                  />
                </div>
              </article>
            ))}
          </div>

          <h2 className="font-display mb-4 text-lg font-semibold tracking-tight text-navy-900">Summary</h2>
          <div className="space-y-8">
            <section>
              <h3 className="mb-3 text-sm font-semibold tracking-tight text-navy-900">By nature of appointment</h3>
              <DataTable
                exportName="faculty-by-appointment"
                columns={[
                  { key: "college", header: "College", accessor: (row) => row.college },
                  { key: "total", header: "Total", accessor: (row) => row.total },
                  { key: "perm", header: "Permanent", accessor: (row) => row.counts.appointment?.Permanent },
                  { key: "temp", header: "Temporary", accessor: (row) => row.counts.appointment?.Temporary },
                  { key: "cos", header: "COS", accessor: (row) => row.counts.appointment?.COS },
                ]}
                rows={parsed}
              />
            </section>
            <section>
              <h3 className="mb-3 text-sm font-semibold tracking-tight text-navy-900">By academic rank</h3>
              <DataTable
                exportName="faculty-by-academic-rank"
                columns={[
                  { key: "college", header: "College", accessor: (row) => row.college },
                  { key: "total", header: "Total", accessor: (row) => row.total },
                  { key: "instructor", header: "Instructor", accessor: (row) => row.counts.rank?.Instructor },
                  {
                    key: "asst",
                    header: "Asst. Professor",
                    accessor: (row) => row.counts.rank?.["Assistant Professor"],
                  },
                  {
                    key: "assoc",
                    header: "Assoc. Professor",
                    accessor: (row) => row.counts.rank?.["Associate Professor"],
                  },
                  { key: "professor", header: "Professor", accessor: (row) => row.counts.rank?.Professor },
                  {
                    key: "univ",
                    header: "University Professor",
                    accessor: (row) => row.counts.rank?.["University Professor"],
                    hideOnMobile: true,
                  },
                ]}
                rows={parsed}
              />
            </section>
            <section>
              <h3 className="mb-3 text-sm font-semibold tracking-tight text-navy-900">By highest educational attainment</h3>
              <DataTable
                exportName="faculty-by-education"
                columns={[
                  { key: "college", header: "College", accessor: (row) => row.college },
                  { key: "total", header: "Total", accessor: (row) => row.total },
                  { key: "bachelors", header: "Bachelor's", accessor: (row) => row.counts.education?.["Bachelor's Degree"] },
                  { key: "masters", header: "Master's", accessor: (row) => row.counts.education?.["Master's Degree"] },
                  { key: "doctorate", header: "Doctorate", accessor: (row) => row.counts.education?.["Doctorate Degree"] },
                ]}
                rows={parsed}
              />
            </section>
          </div>
        </>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/personnel/non-teaching">Non-teaching personnel</Link>
      </p>
    </div>
  );
}
