import { saveExtensionAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { dateToInput } from "@/lib/admin/editor";
import { prisma } from "@/lib/db";

export default async function ExtensionAdminPage() {
  const rows = await prisma.extensionProgram.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Extension programs"
        description="Edit BOR-approved extension programs. Saving publishes to the Extension page and related performance counts."
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
    </div>
  );
}
