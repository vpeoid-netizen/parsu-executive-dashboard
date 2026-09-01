import { saveAssetAction } from "@/app/admin/actions";

export default function AssetsAdminPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Physical assets</h1>
      <form action={saveAssetAction} className="card grid gap-3 p-5">
        <select name="kind" className="field">
          <option value="land">Land</option>
          <option value="building">Building</option>
          <option value="vehicle">Vehicle</option>
        </select>
        <input name="name" required placeholder="Name / location" className="field" />
        <input name="type" placeholder="Type / area / plate details" className="field" />
        <input name="status" placeholder="Status" className="field" />
        <input name="plate" placeholder="Plate / property no. (vehicles)" className="field" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publish
        </label>
        <button className="btn btn-primary w-fit">Add record</button>
      </form>
    </div>
  );
}
