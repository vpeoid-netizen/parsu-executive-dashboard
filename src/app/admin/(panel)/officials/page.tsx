import { saveOfficialsTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

export default async function OfficialsAdminPage() {
  const officials = await prisma.official.findMany({ orderBy: { displayOrder: "asc" } });
  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="University officials"
        description="Edit names, positions, and offices. Uncheck Published to hide an official from the public About page without deleting the row."
      />
      <WorkbookEditor
        title="Officials directory"
        description="Display order is lowest first. Section is the heading on the public page, such as Board of Regents or Administrative Council."
        saveAction={saveOfficialsTableAction}
        addLabel="Add official"
        addRowDefaults={{ published: true, displayOrder: officials.length }}
        columns={[
          { key: "displayOrder", header: "Order", type: "number", min: 0, width: "6rem" },
          { key: "name", header: "Name", type: "text", required: true, width: "14rem" },
          { key: "position", header: "Position", type: "text", required: true, width: "16rem" },
          { key: "office", header: "Office", type: "text", width: "14rem" },
          { key: "section", header: "Section heading", type: "text", width: "14rem" },
          { key: "email", header: "Email", type: "text", width: "14rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={officials.map((official) => ({
          id: official.id,
          displayOrder: official.displayOrder,
          name: official.name,
          position: official.position,
          office: official.office ?? "",
          section: official.section ?? "",
          email: official.email ?? "",
          published: official.published,
        }))}
      />
    </div>
  );
}
