import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";

export default async function InfrastructurePage() {
  const projects = await prisma.infrastructureProject.findMany({
    where: { status: "PUBLISHED" },
    include: { reports: { orderBy: { reportingMonth: "desc" } } },
  });
  const ongoing = projects.filter((item) => item.classification === "ONGOING");
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Infrastructure" }]} />
      <ModuleHeader
        title="Infrastructure Monitoring"
        description="On-going, approved and proposed priority projects, including monthly status reports when encoded."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard title="On-going" value={ongoing.length || null} />
        <KpiCard title="Approved" value={projects.filter((item) => item.classification === "APPROVED").length || null} />
        <KpiCard title="Proposed" value={projects.filter((item) => item.classification === "PROPOSED").length || null} />
      </div>
      {projects.length === 0 ? (
        <EmptyState description="Infrastructure projects are not yet available." />
      ) : (
        <DataTable
          exportName="infrastructure"
          columns={[
            { key: "class", header: "Class", accessor: (row) => row.classification },
            { key: "name", header: "Project", accessor: (row) => row.name },
            { key: "cost", header: "Cost", accessor: (row) => (row.projectCost ? formatPeso(Number(row.projectCost)) : null) },
            { key: "physical", header: "Physical %", accessor: (row) => row.physicalAccomplishment },
            { key: "status", header: "Status", accessor: (row) => row.projectStatus },
          ]}
          rows={projects}
        />
      )}
    </div>
  );
}
