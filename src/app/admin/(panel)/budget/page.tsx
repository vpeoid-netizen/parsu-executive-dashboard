import { saveBudgetAction } from "@/app/admin/actions";

export default function BudgetAdminPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Budget records</h1>
      <form action={saveBudgetAction} className="card grid gap-3 p-5">
        <input name="fiscalYear" type="number" defaultValue={2026} className="field" />
        <input name="fundingSource" placeholder="Funding source" className="field" />
        <input name="programPap" placeholder="Program / PAP" className="field" />
        <input name="budget" type="number" step="0.01" placeholder="Budget" className="field" />
        <input name="obligation" type="number" step="0.01" placeholder="Obligation" className="field" />
        <input name="disbursement" type="number" step="0.01" placeholder="Disbursement" className="field" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="public" defaultChecked /> Publicly publishable
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publish
        </label>
        <button className="btn btn-primary w-fit">Add budget row</button>
      </form>
    </div>
  );
}
