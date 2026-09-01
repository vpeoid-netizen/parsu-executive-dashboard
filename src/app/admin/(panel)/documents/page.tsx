import { saveDocumentAction } from "@/app/admin/actions";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function DocumentsAdminPage() {
  const documents = await prisma.documentRecord.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Documents</h1>
      <form action={saveDocumentAction} className="card grid gap-3 p-5">
        <input name="title" required placeholder="Title" className="field" />
        <select name="category" className="field">
          {DOCUMENT_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input name="externalUrl" placeholder="External URL" className="field" />
        <input name="version" placeholder="Version" className="field" />
        <textarea name="description" placeholder="Description" className="field" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publish
        </label>
        <button className="btn btn-primary w-fit">Add document</button>
      </form>
      <ul className="card divide-y overflow-hidden text-sm">
        {documents.map((doc) => (
          <li key={doc.id} className="px-4 py-3">
            {doc.title} — {doc.category} ({doc.published ? "published" : "draft"})
          </li>
        ))}
      </ul>
    </div>
  );
}
