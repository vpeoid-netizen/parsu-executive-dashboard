import { saveInfrastructureAction } from "@/app/admin/actions";

export default function InfrastructureAdminPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Infrastructure</h1>
      <form action={saveInfrastructureAction} className="card grid gap-3 p-5">
        <select name="classification" className="field">
          <option value="ONGOING">On-going</option>
          <option value="APPROVED">Approved</option>
          <option value="PROPOSED">Proposed</option>
        </select>
        <input name="name" required placeholder="Project name" className="field" />
        <input name="contractor" placeholder="Contractor" className="field" />
        <input name="projectStatus" placeholder="Status" className="field" />
        <textarea name="notes" placeholder="Delay / status notes" className="field" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publish
        </label>
        <button className="btn btn-primary w-fit">Add project</button>
      </form>
    </div>
  );
}
