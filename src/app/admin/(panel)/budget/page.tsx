import { saveBudgetTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

export default async function BudgetAdminPage() {
  const rows = await prisma.budgetRecord.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    orderBy: [{ fiscalYear: "desc" }, { programPap: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Budget records"
        description="Edit fiscal-year budget, obligation, and disbursement rows. Uncheck Published to keep a draft off the public Budget page."
      />
      <WorkbookEditor
        title="Budget by program"
        description="Amounts are in pesos. Only published and publicly publishable rows appear on the public site."
        saveAction={saveBudgetTableAction}
        addLabel="Add budget row"
        addRowDefaults={{ fiscalYear: 2026, published: true, publiclyPublishable: true }}
        columns={[
          { key: "fiscalYear", header: "Fiscal year", type: "number", required: true, width: "8rem" },
          { key: "fundingSource", header: "Funding source", type: "text", width: "12rem" },
          { key: "programPap", header: "Program / PAP", type: "text", width: "16rem" },
          { key: "category", header: "Category", type: "text", width: "10rem" },
          { key: "budget", header: "Budget", type: "number", min: 0, step: "0.01", width: "9rem" },
          { key: "obligation", header: "Obligation", type: "number", min: 0, step: "0.01", width: "9rem" },
          { key: "disbursement", header: "Disbursement", type: "number", min: 0, step: "0.01", width: "10rem" },
          { key: "publiclyPublishable", header: "Public", type: "checkbox", width: "6rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          fiscalYear: row.fiscalYear,
          fundingSource: row.fundingSource ?? "",
          programPap: row.programPap ?? "",
          category: row.category ?? "",
          budget: row.budget == null ? null : Number(row.budget),
          obligation: row.obligation == null ? null : Number(row.obligation),
          disbursement: row.disbursement == null ? null : Number(row.disbursement),
          publiclyPublishable: row.publiclyPublishable,
          published: row.status === "PUBLISHED",
        }))}
      />
    </div>
  );
}
