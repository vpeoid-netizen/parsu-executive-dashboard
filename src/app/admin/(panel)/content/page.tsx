import { savePageAction, saveFlagshipAction } from "@/app/admin/actions";
import { prisma } from "@/lib/db";

export default async function ContentAdminPage() {
  const pages = await prisma.institutionalPage.findMany();
  const flagships = await prisma.flagshipProgram.findMany({ orderBy: { displayOrder: "asc" } });
  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Manage content</h1>
      {pages.map((page) => (
        <form key={page.id} action={savePageAction} className="card p-5">
          <input type="hidden" name="slug" value={page.slug} />
          <h2 className="text-lg font-semibold tracking-tight">{page.title}</h2>
          <label className="mt-3 block text-sm">Title</label>
          <input name="title" defaultValue={page.title} className="field mt-1" />
          <label className="mt-3 block text-sm">Body (Markdown)</label>
          <textarea name="body" rows={8} defaultValue={page.body} className="field mt-1" />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={page.published} /> Publish
          </label>
          <button className="btn btn-primary mt-4">Save</button>
        </form>
      ))}
      <section className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Add flagship program</h2>
        <form action={saveFlagshipAction} className="mt-4 grid gap-3">
          <input name="title" required placeholder="Title" className="field" />
          <input name="shortDescription" placeholder="Short description" className="field" />
          <textarea name="fullDescription" placeholder="Full description" className="field" />
          <input name="office" placeholder="Office" className="field" />
          <input name="programLead" placeholder="Program lead" className="field" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showOnHomepage" /> Show on homepage
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" /> Publish
          </label>
          <button className="btn btn-primary w-fit">Add program</button>
        </form>
        <ul className="mt-4 text-sm">
          {flagships.map((item) => (
            <li key={item.id}>{item.title} — {item.published ? "published" : "draft"}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
