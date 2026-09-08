import { saveStaffAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { campusCollegeOptions } from "@/lib/admin/reference-options";
import { prisma } from "@/lib/db";
import { appointmentHeadcount } from "@/lib/staff-offices";

type CountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
};

export default async function StaffAdminPage() {
  const [{ campuses }, rows] = await Promise.all([
    campusCollegeOptions(),
    prisma.staffSnapshot.findMany({ where: { status: "PUBLISHED" }, orderBy: { sourceRow: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Non-teaching personnel"
        description="Edit NTP headcount by department, office, and unit. The total is the sum of Permanent, Casual, and Job Order. Saving publishes to Non-Teaching Personnel and homepage KPIs."
      />
      <WorkbookEditor
        title="Personnel by office"
        description="Same layout as the non-teaching worksheet, with labeled columns instead of spreadsheet letters."
        excelSheet="4 Non-Teaching Personnel"
        saveAction={saveStaffAction}
        addLabel="Add office row"
        totalFrom={["permanent", "casual", "jobOrder"]}
        addRowDefaults={{ permanent: 0, casual: 0, jobOrder: 0, aide: 0, assistant: 0, officer: 0, supervising: 0, chief: 0, total: 0 }}
        columns={[
          { key: "campusId", header: "Campus", type: "select", options: campuses, width: "11rem" },
          { key: "department", header: "Department / cluster", type: "text", width: "16rem" },
          { key: "office", header: "Office", type: "text", width: "16rem" },
          { key: "unit", header: "Unit / section", type: "text", width: "12rem" },
          { key: "permanent", header: "Permanent", group: "Nature of appointment", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "casual", header: "Casual", group: "Nature of appointment", type: "number", min: 0, sumFooter: true, width: "6rem" },
          { key: "jobOrder", header: "Job Order", group: "Nature of appointment", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "aide", header: "Aide", group: "Plantilla rank", type: "number", min: 0, sumFooter: true, width: "5.5rem" },
          { key: "assistant", header: "Assistant", group: "Plantilla rank", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "officer", header: "Officer", group: "Plantilla rank", type: "number", min: 0, sumFooter: true, width: "6.5rem" },
          { key: "supervising", header: "Supervising", group: "Plantilla rank", type: "number", min: 0, sumFooter: true, width: "8rem" },
          { key: "chief", header: "Chief", group: "Plantilla rank", type: "number", min: 0, sumFooter: true, width: "5.5rem" },
          { key: "total", header: "Total", type: "readonly", hint: "Appointment sum", sumFooter: true, width: "6rem" },
        ]}
        rows={rows.map((row) => {
          const counts = JSON.parse(row.countsJson) as CountGroups;
          return {
            id: row.id,
            campusId: row.campusId ?? "",
            department: row.department ?? "",
            office: row.office ?? "",
            unit: row.unit ?? "",
            permanent: counts.appointment?.Permanent ?? 0,
            casual: counts.appointment?.Casual ?? 0,
            jobOrder: counts.appointment?.["Job Order"] ?? 0,
            aide: counts.rank?.Aide ?? 0,
            assistant: counts.rank?.Assistant ?? 0,
            officer: counts.rank?.Officer ?? 0,
            supervising: counts.rank?.Supervising ?? 0,
            chief: counts.rank?.Chief ?? 0,
            total: row.total ?? appointmentHeadcount(counts),
          };
        })}
      />
    </div>
  );
}
