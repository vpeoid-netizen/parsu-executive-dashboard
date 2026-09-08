import { saveDocumentsTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function DocumentsAdminPage() {
  const documents = await prisma.documentRecord.findMany({ orderBy: { title: "asc" } });
  const categories = DOCUMENT_CATEGORIES.map((category) => ({ value: category, label: category }));
  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Documents"
        description="Edit titles, categories, and links. Published documents appear on the public Documents pages."
      />
      <WorkbookEditor
        title="Institutional documents"
        description="Prefer an external URL (Google Drive or the ParSU website) so files stay in existing repositories."
        saveAction={saveDocumentsTableAction}
        addLabel="Add document"
        addRowDefaults={{ category: "Other", published: true }}
        columns={[
          { key: "title", header: "Title", type: "text", required: true, width: "18rem" },
          { key: "category", header: "Category", type: "select", options: categories, width: "14rem" },
          { key: "externalUrl", header: "Link", type: "text", width: "18rem" },
          { key: "version", header: "Version", type: "text", width: "8rem" },
          { key: "description", header: "Description", type: "textarea", width: "16rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          externalUrl: doc.externalUrl ?? "",
          version: doc.version ?? "",
          description: doc.description ?? "",
          published: doc.published,
        }))}
      />
    </div>
  );
}
