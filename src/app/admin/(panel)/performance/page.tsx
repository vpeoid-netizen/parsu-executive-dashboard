import { savePerformanceAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

const INDICATOR_TYPE_OPTIONS = [
  { value: "Outcome Indicator", label: "Outcome Indicator" },
  { value: "Output Indicator", label: "Output Indicator" },
  { value: "Indicator", label: "Indicator" },
];

export default async function PerformanceAdminPage() {
  const rows = await prisma.performanceObservation.findMany({
    where: { status: "PUBLISHED" },
    include: { indicator: true },
    orderBy: [{ fiscalYear: "asc" }, { sourceRow: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="University performance"
        description="Edit targets and accomplishments by fiscal year. Keep FY 2026 marked as a partial period unless a later full-year file is published."
      />
      <WorkbookEditor
        title="Performance indicators"
        description="Same indicators as the university performance worksheet. Target and accomplishment can be a number, a percent (66%), or a fraction (12/18)."
        excelSheet="7 University Performance"
        saveAction={savePerformanceAction}
        addLabel="Add observation"
        addRowDefaults={{ fiscalYear: 2026, isPartial: true, indicatorType: "Outcome Indicator" }}
        columns={[
          { key: "programMfo", header: "Program / MFO", type: "text", hint: "Higher Education, Research…", width: "16rem" },
          { key: "indicatorType", header: "Type", type: "select", options: INDICATOR_TYPE_OPTIONS, width: "12rem" },
          { key: "title", header: "Indicator", type: "textarea", required: true, width: "22rem" },
          { key: "fiscalYear", header: "Fiscal year", type: "number", width: "8rem" },
          { key: "targetRaw", header: "Target", type: "text", width: "8rem" },
          { key: "accomplishmentRaw", header: "Accomplishment", type: "text", width: "10rem" },
          { key: "isPartial", header: "Partial year", type: "checkbox", width: "8rem" },
          { key: "remarks", header: "Remarks", type: "text", width: "14rem" },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          programMfo: row.indicator.programMfo,
          indicatorType: row.indicator.indicatorType,
          title: row.indicator.title,
          fiscalYear: row.fiscalYear,
          targetRaw: row.targetRaw ?? "",
          accomplishmentRaw: row.accomplishmentRaw ?? "",
          isPartial: row.isPartial,
          remarks: row.remarks ?? "",
        }))}
      />
    </div>
  );
}
