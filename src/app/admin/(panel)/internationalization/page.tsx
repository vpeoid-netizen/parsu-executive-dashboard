import { savePartnerAction } from "@/app/admin/actions";

export default function InternationalizationAdminPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Internationalization</h1>
      <form action={savePartnerAction} className="card grid gap-3 p-5">
        <input name="institution" required placeholder="Institution" className="field" />
        <input name="country" placeholder="Country" className="field" />
        <input name="agreementType" placeholder="Agreement type" className="field" />
        <input name="partnerStatus" placeholder="Status" className="field" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publish
        </label>
        <button className="btn btn-primary w-fit">Add partner</button>
      </form>
    </div>
  );
}
