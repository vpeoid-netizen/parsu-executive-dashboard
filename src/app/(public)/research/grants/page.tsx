import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";

export default async function GrantsPage() {
  const rows = await prisma.researchGrant.findMany({ where: { status: "PUBLISHED" } });
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/research", label: "Research" }, { label: "Approved Grants" }]} />
      <ModuleHeader
        title="Approved Research Grants"
        description="Grant records will appear here once they are encoded."
      />
      {rows.length === 0 ? (
        <EmptyState description="Research grants are not yet available." />
      ) : (
        <DataTable
          exportName="research-grants"
          columns={[
            { key: "title", header: "Project", accessor: (row) => row.title },
            { key: "pi", header: "Principal investigator", accessor: (row) => row.principalInvestigator },
            { key: "agency", header: "Funding agency", accessor: (row) => row.fundingAgency },
            { key: "amount", header: "Amount", accessor: (row) => (row.amount ? formatPeso(Number(row.amount)) : null) },
            { key: "status", header: "Status", accessor: (row) => row.grantStatus },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
