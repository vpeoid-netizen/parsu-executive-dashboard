import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function InternationalizationPage() {
  const [partners, memberships] = await Promise.all([
    prisma.internationalPartner.findMany({ where: { status: "PUBLISHED" } }),
    prisma.internationalMembership.findMany({ where: { status: "PUBLISHED" } }),
  ]);
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Internationalization" }]} />
      <ModuleHeader
        title="Internationalization"
        description="Partners and memberships. A world map can be shown when country codes are supplied."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <KpiCard title="International partners" value={partners.length || null} />
        <KpiCard title="Memberships" value={memberships.length || null} />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Partners</h2>
          {partners.length ? (
            <DataTable
              exportName="international-partners"
              columns={[
                { key: "institution", header: "Institution", accessor: (row) => row.institution },
                { key: "country", header: "Country", accessor: (row) => row.country },
                { key: "type", header: "Agreement", accessor: (row) => row.agreementType },
                { key: "expiry", header: "Expiration", accessor: (row) => formatDate(row.expiration) },
              ]}
              rows={partners}
            />
          ) : (
            <EmptyState />
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Memberships</h2>
          {memberships.length ? (
            <DataTable
              exportName="international-memberships"
              columns={[
                { key: "org", header: "Organization", accessor: (row) => row.organization },
                { key: "type", header: "Type", accessor: (row) => row.membershipType },
                { key: "status", header: "Status", accessor: (row) => row.membershipStatus },
              ]}
              rows={memberships}
            />
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </div>
  );
}
