import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ChartPanel, ComparisonBars } from "@/components/charts/charts";
import { CollegeAbbrevKey } from "@/components/ui/college-abbrev-key";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { collegeChartPoint, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";

type CountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
  education?: Record<string, number>;
};

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
  const byCollege = parsed
    .filter((row) => row.total > 0)
    .map((row) => collegeChartPoint(row.collegeCode, { Faculty: row.total }));

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
          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <ChartPanel title="By academic rank">
              <ComparisonBars
                data={[
                  "Instructor",
                  "Assistant Professor",
                  "Associate Professor",
                  "Professor",
                  "University Professor",
                ].map((name) => ({ name, Faculty: sumBy("rank", name) }))}
                xKey="name"
                bars={[{ key: "Faculty", label: "Faculty" }]}
              />
            </ChartPanel>
            <ChartPanel title="By college">
              <ComparisonBars
                data={byCollege}
                xKey="name"
                bars={[{ key: "Faculty", label: "Faculty" }]}
                horizontal
                categoryWidth={56}
              />
              <CollegeAbbrevKey codes={byCollege.map((item) => item.code)} />
            </ChartPanel>
          </div>
          <DataTable
            exportName="faculty-snapshots"
            columns={[
              { key: "college", header: "College", accessor: (row) => row.college },
              { key: "total", header: "Total", accessor: (row) => row.total },
              { key: "perm", header: "Permanent", accessor: (row) => row.counts.appointment?.Permanent },
              { key: "temp", header: "Temporary", accessor: (row) => row.counts.appointment?.Temporary },
              { key: "cos", header: "COS", accessor: (row) => row.counts.appointment?.COS },
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
