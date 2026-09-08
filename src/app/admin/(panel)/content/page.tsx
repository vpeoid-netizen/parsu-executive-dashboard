import { savePageAction } from "@/app/admin/actions";
import { saveFlagshipsTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

export default async function ContentAdminPage() {
  const pages = await prisma.institutionalPage.findMany({ orderBy: { title: "asc" } });
  const flagships = await prisma.flagshipProgram.findMany({ orderBy: { displayOrder: "asc" } });
  return (
    <div className="space-y-10">
      <AdminModuleIntro
        title="Manage content"
        description="Update About pages and flagship programs. Page bodies use Markdown. Saving a page publishes that page immediately."
      />
      {pages.map((page) => (
        <form key={page.id} action={savePageAction} className="card p-5">
          <input type="hidden" name="slug" value={page.slug} />
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">{page.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">/{page.slug}</p>
          <label className="mt-4 block text-sm font-medium" htmlFor={`title-${page.id}`}>
            Title
          </label>
          <input id={`title-${page.id}`} name="title" defaultValue={page.title} className="field mt-1" />
          <label className="mt-4 block text-sm font-medium" htmlFor={`body-${page.id}`}>
            Body
          </label>
          <p className="mt-1 text-xs text-muted-foreground">Markdown is supported. Spell the brand ParSU, not PARSU.</p>
          <textarea id={`body-${page.id}`} name="body" rows={10} defaultValue={page.body} className="field mt-1" />
          <label className="mt-4 flex min-h-11 items-center gap-2 text-sm" htmlFor={`published-${page.id}`}>
            <input id={`published-${page.id}`} type="checkbox" name="published" defaultChecked={page.published} />
            Publish this page
          </label>
          <button className="btn btn-primary mt-4">Save page</button>
        </form>
      ))}
      <WorkbookEditor
        title="Flagship programs"
        description="Short description appears in cards. Full description is the program page body."
        saveAction={saveFlagshipsTableAction}
        addLabel="Add flagship program"
        addRowDefaults={{ published: true, showOnHomepage: false, displayOrder: flagships.length }}
        columns={[
          { key: "displayOrder", header: "Order", type: "number", min: 0, width: "6rem" },
          { key: "title", header: "Title", type: "text", required: true, width: "14rem" },
          { key: "shortDescription", header: "Short description", type: "textarea", width: "16rem" },
          { key: "fullDescription", header: "Full description", type: "textarea", width: "18rem" },
          { key: "office", header: "Office", type: "text", width: "12rem" },
          { key: "programLead", header: "Program lead", type: "text", width: "12rem" },
          { key: "programStatus", header: "Status", type: "text", width: "9rem" },
          { key: "showOnHomepage", header: "Homepage", type: "checkbox", width: "8rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={flagships.map((item) => ({
          id: item.id,
          displayOrder: item.displayOrder,
          title: item.title,
          shortDescription: item.shortDescription ?? "",
          fullDescription: item.fullDescription ?? "",
          office: item.office ?? "",
          programLead: item.programLead ?? "",
          programStatus: item.programStatus ?? "",
          showOnHomepage: item.showOnHomepage,
          published: item.published,
        }))}
      />
    </div>
  );
}
