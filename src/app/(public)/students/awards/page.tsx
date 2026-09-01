import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AwardsPage() {
  const awards = await prisma.studentAward.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { occurredOn: "desc" },
  });
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/students", label: "Students" }, { label: "Awards" }]} />
      <ModuleHeader title="Student Awards" description="Student and team recognitions." />
      {awards.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {awards.slice(0, 6).map((award) => (
              <article key={award.id} className="card p-5">
                <p className="text-xs uppercase tracking-wide text-gold">{award.awardRank}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{award.recipient}</h2>
                <p className="text-sm text-muted-foreground">{award.eventName}</p>
                <p className="mt-2 text-sm">{award.occurredRaw ?? formatDate(award.occurredOn)}</p>
              </article>
            ))}
          </div>
          <DataTable
            exportName="student-awards"
            columns={[
              { key: "recipient", header: "Student / team", accessor: (row) => row.recipient },
              { key: "program", header: "Program", accessor: (row) => row.programName },
              { key: "event", header: "Event", accessor: (row) => row.eventName },
              { key: "rank", header: "Award", accessor: (row) => row.awardRank },
              { key: "date", header: "Date", accessor: (row) => row.occurredRaw ?? formatDate(row.occurredOn) },
            ]}
            rows={awards}
          />
        </>
      )}
    </div>
  );
}
