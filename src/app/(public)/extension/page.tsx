import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function ExtensionPage() {
  const [programs, partners, performance] = await Promise.all([
    prisma.extensionProgram.findMany({ where: { status: "PUBLISHED" } }),
    prisma.extensionPartner.findMany({ where: { status: "PUBLISHED" } }),
    prisma.performanceObservation.findMany({
      where: {
        status: "PUBLISHED",
        fiscalYear: 2025,
        indicator: { programMfo: "Technical Advisory Extension Program" },
      },
      include: { indicator: true },
    }),
  ]);
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Extension" }]} />
      <ModuleHeader
        title="Extension"
        description="BOR-approved programs and partners."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="BOR-approved programs" value={programs.length || null} />
        <KpiCard title="Active partners" value={partners.length || null} />
        {performance.map((row) => (
          <KpiCard
            key={row.id}
            title={row.indicator.title.slice(0, 48)}
            value={row.accomplishmentValue}
            note={row.accomplishmentRaw}
          />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">BOR-approved programs</h2>
          {programs.length ? (
            <DataTable
              exportName="extension-programs"
              columns={[
                { key: "title", header: "Program", accessor: (row) => row.title },
                { key: "date", header: "Approved", accessor: (row) => formatDate(row.approvedAt) },
                { key: "office", header: "Implementers", accessor: (row) => row.office },
              ]}
              rows={programs}
            />
          ) : (
            <EmptyState description="BOR-approved extension programs are not yet available." />
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Extension partners</h2>
          {partners.length ? (
            <DataTable
              exportName="extension-partners"
              columns={[
                { key: "org", header: "Organization", accessor: (row) => row.organization },
                { key: "type", header: "Type", accessor: (row) => row.organizationType },
                { key: "status", header: "Status", accessor: (row) => row.partnerStatus },
              ]}
              rows={partners}
            />
          ) : (
            <EmptyState description="Extension partners are not yet available." />
          )}
        </section>
      </div>
    </div>
  );
}
