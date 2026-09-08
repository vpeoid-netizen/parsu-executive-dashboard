import { saveInfrastructureTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

const CLASSIFICATION_OPTIONS = [
  { value: "ONGOING", label: "On-going" },
  { value: "APPROVED", label: "Approved" },
  { value: "PROPOSED", label: "Proposed" },
];

export default async function InfrastructureAdminPage() {
  const rows = await prisma.infrastructureProject.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Infrastructure"
        description="Edit on-going, approved, and proposed projects. Saving a published row updates the public Infrastructure page."
      />
      <WorkbookEditor
        title="Projects"
        description="Physical and financial accomplishment can be entered as percentages (for example 75)."
        saveAction={saveInfrastructureTableAction}
        addLabel="Add project"
        addRowDefaults={{ classification: "ONGOING", published: true }}
        columns={[
          { key: "classification", header: "Classification", type: "select", options: CLASSIFICATION_OPTIONS, width: "11rem" },
          { key: "name", header: "Project name", type: "textarea", required: true, width: "18rem" },
          { key: "contractor", header: "Contractor", type: "text", width: "12rem" },
          { key: "sourceOfFund", header: "Source of fund", type: "text", width: "12rem" },
          { key: "projectStatus", header: "Status", type: "text", width: "10rem" },
          { key: "physicalAccomplishment", header: "Physical %", type: "number", min: 0, step: "0.01", width: "8rem" },
          { key: "financialAccomplishment", header: "Financial %", type: "number", min: 0, step: "0.01", width: "8rem" },
          { key: "delayNotes", header: "Delay / notes", type: "textarea", width: "16rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          classification: row.classification,
          name: row.name,
          contractor: row.contractor ?? "",
          sourceOfFund: row.sourceOfFund ?? "",
          projectStatus: row.projectStatus ?? "",
          physicalAccomplishment: row.physicalAccomplishment,
          financialAccomplishment: row.financialAccomplishment,
          delayNotes: row.delayNotes ?? "",
          published: row.status === "PUBLISHED",
        }))}
      />
    </div>
  );
}
