import {
  saveResearchCompletedAction,
  saveResearchGrantsAction,
  saveResearchPublicationsAction,
  saveResearchUtilizationAction,
} from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";
import { authorsJsonToEditorText } from "@/lib/research";

export default async function ResearchAdminPage() {
  const [completed, publications, utilization, grants] = await Promise.all([
    prisma.researchCompletion.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ fiscalYear: "desc" }, { title: "asc" }] }),
    prisma.researchPublication.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ fiscalYear: "desc" }, { publishedTitle: "asc" }] }),
    prisma.researchUtilization.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ fiscalYear: "desc" }, { productName: "asc" }] }),
    prisma.researchGrant.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="space-y-12">
      <AdminModuleIntro
        title="Research datasets"
        description="Edit completed studies, publications, utilization, and grants. Authors can include rank in parentheses, for example: Santos, A. (Assistant Professor)."
      />
      <nav className="flex flex-wrap gap-2 text-sm">
        {[
          ["#completed", "Completed"],
          ["#publications", "Publications"],
          ["#utilization", "Utilization"],
          ["#grants", "Grants"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="btn btn-ghost">
            {label}
          </a>
        ))}
      </nav>

      <div id="completed">
        <WorkbookEditor
          title="Completed research"
          description="One row per completed study."
          excelSheet="8 Research Completed"
          saveAction={saveResearchCompletedAction}
          addLabel="Add completed study"
          addRowDefaults={{ fiscalYear: 2026 }}
          columns={[
            { key: "fiscalYear", header: "Fiscal year", type: "number", width: "8rem" },
            { key: "quarter", header: "Quarter", type: "number", min: 1, width: "7rem" },
            { key: "title", header: "Research title", type: "textarea", required: true, width: "22rem" },
            { key: "authors", header: "Authors", type: "textarea", hint: "Separate with semicolons", width: "18rem" },
          ]}
          rows={completed.map((row) => ({
            id: row.id,
            fiscalYear: row.fiscalYear,
            quarter: row.quarter,
            title: row.title,
            authors: authorsJsonToEditorText(row.authorsJson),
          }))}
        />
      </div>

      <div id="publications">
        <WorkbookEditor
          title="Research publications"
          description="One row per published output."
          excelSheet="8 Research Publication"
          saveAction={saveResearchPublicationsAction}
          addLabel="Add publication"
          addRowDefaults={{ fiscalYear: 2026 }}
          columns={[
            { key: "fiscalYear", header: "Fiscal year", type: "number", width: "8rem" },
            { key: "publishedTitle", header: "Published title", type: "textarea", required: true, width: "20rem" },
            { key: "authors", header: "Authors", type: "textarea", width: "16rem" },
            { key: "journal", header: "Journal / venue", type: "text", width: "14rem" },
            { key: "indexing", header: "Indexing", type: "text", width: "10rem" },
            { key: "doi", header: "DOI", type: "text", width: "12rem" },
          ]}
          rows={publications.map((row) => ({
            id: row.id,
            fiscalYear: row.fiscalYear,
            publishedTitle: row.publishedTitle,
            authors: authorsJsonToEditorText(row.authorsJson),
            journal: row.journal ?? "",
            indexing: row.indexing ?? "",
            doi: row.doi ?? "",
          }))}
        />
      </div>

      <div id="utilization">
        <WorkbookEditor
          title="Research utilization"
          description="Products or outputs adopted by beneficiaries."
          excelSheet="8 Research Utilization"
          saveAction={saveResearchUtilizationAction}
          addLabel="Add utilization row"
          addRowDefaults={{ fiscalYear: 2026 }}
          columns={[
            { key: "fiscalYear", header: "Fiscal year", type: "number", width: "8rem" },
            { key: "collegeCode", header: "College code", type: "text", width: "8rem" },
            { key: "productName", header: "Product / output", type: "text", width: "14rem" },
            { key: "researchTitle", header: "Research title", type: "textarea", width: "18rem" },
            { key: "beneficiary", header: "Beneficiary", type: "text", width: "12rem" },
            { key: "patentOrDescription", header: "Patent / description", type: "text", width: "14rem" },
            { key: "authors", header: "Authors", type: "textarea", width: "14rem" },
          ]}
          rows={utilization.map((row) => ({
            id: row.id,
            fiscalYear: row.fiscalYear,
            collegeCode: row.collegeCode ?? "",
            productName: row.productName ?? "",
            researchTitle: row.researchTitle ?? "",
            beneficiary: row.beneficiary ?? "",
            patentOrDescription: row.patentOrDescription ?? "",
            authors: authorsJsonToEditorText(row.authorsJson),
          }))}
        />
      </div>

      <div id="grants">
        <WorkbookEditor
          title="Approved grants"
          description="Externally or internally funded research grants."
          saveAction={saveResearchGrantsAction}
          addLabel="Add grant"
          columns={[
            { key: "title", header: "Project", type: "textarea", required: true, width: "18rem" },
            { key: "principalInvestigator", header: "Principal investigator", type: "text", width: "14rem" },
            { key: "fundingAgency", header: "Funding agency", type: "text", width: "12rem" },
            { key: "amount", header: "Amount", type: "number", min: 0, step: "0.01", width: "9rem" },
            { key: "duration", header: "Duration", type: "text", width: "10rem" },
            { key: "grantStatus", header: "Status", type: "text", width: "9rem" },
            { key: "fundingType", header: "Funding type", type: "text", width: "10rem" },
          ]}
          rows={grants.map((row) => ({
            id: row.id,
            title: row.title,
            principalInvestigator: row.principalInvestigator ?? "",
            fundingAgency: row.fundingAgency ?? "",
            amount: row.amount == null ? null : Number(row.amount),
            duration: row.duration ?? "",
            grantStatus: row.grantStatus ?? "",
            fundingType: row.fundingType ?? "",
          }))}
        />
      </div>
    </div>
  );
}
