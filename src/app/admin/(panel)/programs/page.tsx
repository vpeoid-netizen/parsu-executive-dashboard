import { saveProgramsAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { campusCollegeOptions } from "@/lib/admin/reference-options";
import { prisma } from "@/lib/db";

export default async function ProgramsAdminPage() {
  const [{ campuses, colleges }, rows] = await Promise.all([
    campusCollegeOptions(),
    prisma.academicProgram.findMany({ where: { status: "PUBLISHED" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Academic programs"
        description="Edit program names, campuses, COPC, and accreditation. Saving publishes to Academics and updates the program-count KPI."
      />
      <WorkbookEditor
        title="Program inventory"
        description="One row per academic program, matching the academic programs worksheet."
        excelSheet="2 Academic Programs"
        saveAction={saveProgramsAction}
        addLabel="Add program"
        columns={[
          { key: "campusId", header: "Campus", type: "select", options: campuses, width: "11rem" },
          { key: "collegeId", header: "College", type: "select", options: colleges, width: "14rem" },
          { key: "name", header: "Program", type: "text", required: true, width: "18rem" },
          { key: "programType", header: "Type", type: "text", hint: "Baccalaureate, Master’s…", width: "10rem" },
          { key: "specializedMajor", header: "Major / specialization", type: "text", width: "12rem" },
          { key: "copcNumber", header: "COPC number", type: "text", width: "10rem" },
          { key: "accreditationLevel", header: "Accreditation", type: "text", width: "12rem" },
          { key: "programStatus", header: "Status", type: "text", width: "10rem" },
          { key: "accreditable", header: "Accreditable", type: "checkbox", width: "7rem" },
          { key: "accredited", header: "Accredited", type: "checkbox", width: "7rem" },
          { key: "phaseOut", header: "Phase-out", type: "checkbox", width: "7rem" },
          { key: "remarks", header: "Remarks", type: "text", width: "14rem" },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          campusId: row.campusId ?? "",
          collegeId: row.collegeId ?? "",
          name: row.name,
          programType: row.programType ?? "",
          specializedMajor: row.specializedMajor ?? "",
          copcNumber: row.copcNumber ?? "",
          accreditationLevel: row.accreditationLevel ?? "",
          programStatus: row.programStatus ?? "",
          accreditable: Boolean(row.accreditable),
          accredited: Boolean(row.accredited),
          phaseOut: row.phaseOut,
          remarks: row.remarks ?? "",
        }))}
      />
    </div>
  );
}
