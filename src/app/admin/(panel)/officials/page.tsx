import { saveOfficialAction } from "@/app/admin/actions";
import { prisma } from "@/lib/db";

export default async function OfficialsAdminPage() {
  const officials = await prisma.official.findMany({ orderBy: { displayOrder: "asc" } });
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">University officials</h1>
      <form action={saveOfficialAction} className="card grid gap-3 p-5">
        <input name="name" required placeholder="Name" className="field" />
        <input name="position" required placeholder="Position" className="field" />
        <input name="office" placeholder="Office / section" className="field" />
        <input name="section" placeholder="Section heading" className="field" />
        <input name="email" placeholder="Email" className="field" />
        <input name="displayOrder" type="number" defaultValue={0} className="field" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publish
        </label>
        <button className="btn btn-primary w-fit">Add official</button>
      </form>
      <ul className="card divide-y overflow-hidden">
        {officials.map((official) => (
          <li key={official.id} className="px-4 py-3 text-sm">
            {official.name} — {official.position} ({official.published ? "published" : "draft"})
          </li>
        ))}
      </ul>
    </div>
  );
}
