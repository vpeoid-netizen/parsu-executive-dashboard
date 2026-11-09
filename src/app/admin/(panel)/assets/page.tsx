import { saveAssetsTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

const KIND_OPTIONS = [
  { value: "land", label: "Land" },
  { value: "building", label: "Building" },
  { value: "lab", label: "Laboratory" },
  { value: "stay", label: "Accommodation" },
  { value: "vehicle", label: "Vehicle" },
];

export default async function AssetsAdminPage() {
  const [land, buildings, labs, stays, vehicles] = await Promise.all([
    prisma.landAsset.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT"] } }, orderBy: { location: "asc" } }),
    prisma.buildingAsset.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT"] } }, orderBy: { name: "asc" } }),
    prisma.laboratoryAsset.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT"] } }, orderBy: { name: "asc" } }),
    prisma.accommodationAsset.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT"] } }, orderBy: { name: "asc" } }),
    prisma.vehicleAsset.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT"] } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Physical assets"
        description="Edit land, buildings, laboratories, accommodations, and vehicles. Publish a record to show it on the public Assets page."
      />
      <WorkbookEditor
        title="Asset inventory"
        description="Use Kind to choose the record type. Detail is land area, building type, laboratory type, dorm/hostel kind, or plate / property number."
        saveAction={saveAssetsTableAction}
        addLabel="Add asset"
        addRowDefaults={{ kind: "building", published: true }}
        columns={[
          { key: "kind", header: "Kind", type: "select", options: KIND_OPTIONS, width: "11rem" },
          { key: "name", header: "Name / location", type: "text", required: true, width: "16rem" },
          { key: "detail", header: "Type / area / plate", type: "text", width: "14rem" },
          { key: "statusNote", header: "Status / capability", type: "text", width: "14rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={[
          ...land.map((row) => ({
            id: `land:${row.id}`,
            kind: "land",
            name: row.location ?? "",
            detail: row.landArea ?? "",
            statusNote: row.remarks ?? "",
            published: row.status === "PUBLISHED",
          })),
          ...buildings.map((row) => ({
            id: `building:${row.id}`,
            kind: "building",
            name: row.name,
            detail: row.buildingType ?? "",
            statusNote: row.buildingStatus ?? "",
            published: row.status === "PUBLISHED",
          })),
          ...labs.map((row) => ({
            id: `lab:${row.id}`,
            kind: "lab",
            name: row.name,
            detail: row.labType ?? "",
            statusNote: row.capabilitySummary ?? "",
            published: row.status === "PUBLISHED",
          })),
          ...stays.map((row) => ({
            id: `stay:${row.id}`,
            kind: "stay",
            name: row.name,
            detail: row.kind,
            statusNote: row.accommodationStatus ?? "",
            published: row.status === "PUBLISHED",
          })),
          ...vehicles.map((row) => ({
            id: `vehicle:${row.id}`,
            kind: "vehicle",
            name: row.name,
            detail: row.plateOrPropertyNo ?? "",
            statusNote: row.operationalStatus ?? "",
            published: row.status === "PUBLISHED",
          })),
        ]}
      />
    </div>
  );
}
