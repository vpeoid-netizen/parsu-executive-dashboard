import { saveExtensionAction, saveExtensionPartnersAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { dateToInput } from "@/lib/admin/editor";
import { prisma } from "@/lib/db";

export default async function ExtensionAdminPage() {
  const [rows, partners] = await Promise.all([
    prisma.extensionProgram.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
    }),
    prisma.extensionPartner.findMany({
      where: { status: { in: ["PUBLISHED", "DRAFT"] } },
      orderBy: { organization: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <AdminModuleIntro
        title="Extension"
        description="Edit BOR-approved programs and partners. Saving publishes to the Extension page."
      />
      <WorkbookEditor
        title="BOR-approved programs"
        description="Same records as the extension worksheet, with named fields for office, leader, and beneficiaries."
        excelSheet="9 Extension"
        saveAction={saveExtensionAction}
        addLabel="Add program"
        columns={[
          { key: "title", header: "Program title", type: "textarea", required: true, width: "18rem" },
          { key: "borReference", header: "BOR reference", type: "text", width: "10rem" },
          { key: "approvedAt", header: "Approved", type: "date", width: "11rem" },
          { key: "office", header: "Office / implementers", type: "text", width: "14rem" },
          { key: "projectLeader", header: "Project leader", type: "text", width: "12rem" },
          { key: "programStatus", header: "Status", type: "text", width: "9rem" },
          { key: "beneficiaries", header: "Beneficiaries", type: "text", width: "12rem" },
          { key: "location", header: "Location", type: "text", width: "12rem" },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          title: row.title,
          borReference: row.borReference ?? "",
          approvedAt: dateToInput(row.approvedAt),
          office: row.office ?? "",
          projectLeader: row.projectLeader ?? "",
          programStatus: row.programStatus ?? "",
          beneficiaries: row.beneficiaries ?? "",
          location: row.location ?? "",
        }))}
      />
      <WorkbookEditor
        title="Extension partners"
        description="Organizations that appear beside BOR-approved programs on the public Extension page."
        saveAction={saveExtensionPartnersAction}
        addLabel="Add partner"
        addRowDefaults={{ published: true }}
        columns={[
          { key: "organization", header: "Organization", type: "text", required: true, width: "16rem" },
          { key: "organizationType", header: "Type", type: "text", width: "10rem" },
          { key: "location", header: "Location", type: "text", width: "12rem" },
          { key: "startedAt", header: "Started", type: "date", width: "11rem" },
          { key: "endedAt", header: "Ended", type: "date", width: "11rem" },
          { key: "agreement", header: "Agreement", type: "text", width: "12rem" },
          { key: "partnerStatus", header: "Status", type: "text", width: "9rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={partners.map((row) => ({
          id: row.id,
          organization: row.organization,
          organizationType: row.organizationType ?? "",
          location: row.location ?? "",
          startedAt: dateToInput(row.startedAt),
          endedAt: dateToInput(row.endedAt),
          agreement: row.agreement ?? "",
          partnerStatus: row.partnerStatus ?? "",
          published: row.status === "PUBLISHED",
        }))}
      />
    </div>
  );
}
