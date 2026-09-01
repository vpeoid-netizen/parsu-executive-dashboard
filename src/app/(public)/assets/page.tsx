import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";

export default async function AssetsPage() {
  const [land, buildings, labs, stays, vehicles] = await Promise.all([
    prisma.landAsset.findMany({ where: { status: "PUBLISHED" } }),
    prisma.buildingAsset.findMany({ where: { status: "PUBLISHED" } }),
    prisma.laboratoryAsset.findMany({ where: { status: "PUBLISHED" } }),
    prisma.accommodationAsset.findMany({ where: { status: "PUBLISHED" } }),
    prisma.vehicleAsset.findMany({ where: { status: "PUBLISHED" } }),
  ]);
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Physical Assets" }]} />
      <ModuleHeader
        title="Physical Assets"
        description="Land, buildings, laboratories, dormitories/hostel and vehicles. Structures are in place for later encoding."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Land records" value={land.length || null} />
        <KpiCard title="Buildings" value={buildings.length || null} />
        <KpiCard title="Laboratories" value={labs.length || null} />
        <KpiCard title="Accommodations" value={stays.length || null} />
        <KpiCard title="Vehicles" value={vehicles.length || null} />
      </div>
      {![...land, ...buildings, ...labs, ...stays, ...vehicles].length ? (
        <EmptyState description="Physical asset records are not yet available." />
      ) : (
        <div className="space-y-8">
          <DataTable exportName="buildings" columns={[{ key: "name", header: "Building", accessor: (row) => row.name }, { key: "status", header: "Status", accessor: (row) => row.buildingStatus }]} rows={buildings} />
          <DataTable exportName="vehicles" columns={[{ key: "name", header: "Vehicle", accessor: (row) => row.name }, { key: "plate", header: "Plate / property no.", accessor: (row) => row.plateOrPropertyNo }]} rows={vehicles} />
        </div>
      )}
    </div>
  );
}
