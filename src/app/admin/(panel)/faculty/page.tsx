import { saveFacultyAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { campusCollegeOptions } from "@/lib/admin/reference-options";
import { prisma } from "@/lib/db";

type CountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
  education?: Record<string, number>;
};

export default async function FacultyAdminPage() {
  const [{ campuses, colleges }, rows] = await Promise.all([
    campusCollegeOptions(),
    prisma.facultySnapshot.findMany({ where: { status: "PUBLISHED" }, orderBy: { sourceRow: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Faculty members"
        description="Edit faculty headcount by college. Appointment columns should add up to the college total. Saving publishes immediately to Faculty Members and the homepage KPIs."
      />
      <WorkbookEditor
        title="Faculty by college"
        description="Same columns as the faculty worksheet: nature of appointment, academic rank, and highest educational attainment."
        excelSheet="3 Faculty Members"
        saveAction={saveFacultyAction}
        addLabel="Add college row"
        totalFrom={["permanent", "temporary", "cos"]}
        addRowDefaults={{ permanent: 0, temporary: 0, cos: 0, instructor: 0, assistantProfessor: 0, associateProfessor: 0, professor: 0, universityProfessor: 0, bachelors: 0, masters: 0, doctorate: 0, total: 0 }}
        columns={[
          { key: "campusId", header: "Campus", type: "select", options: campuses, width: "11rem" },
          { key: "collegeId", header: "College", type: "select", options: colleges, required: true, width: "14rem" },
          { key: "permanent", header: "Permanent", group: "Nature of appointment", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "temporary", header: "Temporary", group: "Nature of appointment", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "cos", header: "COS", group: "Nature of appointment", type: "number", min: 0, sumFooter: true, width: "6rem" },
          { key: "instructor", header: "Instructor", group: "Academic rank", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "assistantProfessor", header: "Assistant Professor", group: "Academic rank", type: "number", min: 0, sumFooter: true, width: "9rem" },
          { key: "associateProfessor", header: "Associate Professor", group: "Academic rank", type: "number", min: 0, sumFooter: true, width: "9rem" },
          { key: "professor", header: "Professor", group: "Academic rank", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "universityProfessor", header: "University Professor", group: "Academic rank", type: "number", min: 0, sumFooter: true, width: "10rem" },
          { key: "bachelors", header: "Bachelor's", group: "Highest education", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "masters", header: "Master's", group: "Highest education", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "doctorate", header: "Doctorate", group: "Highest education", type: "number", min: 0, sumFooter: true, width: "7rem" },
          { key: "total", header: "Total", type: "readonly", hint: "Permanent + Temporary + COS", sumFooter: true, width: "6rem" },
        ]}
        rows={rows.map((row) => {
          const counts = JSON.parse(row.countsJson) as CountGroups;
          return {
            id: row.id,
            campusId: row.campusId ?? "",
            collegeId: row.collegeId ?? "",
            permanent: counts.appointment?.Permanent ?? 0,
            temporary: counts.appointment?.Temporary ?? 0,
            cos: counts.appointment?.COS ?? 0,
            instructor: counts.rank?.Instructor ?? 0,
            assistantProfessor: counts.rank?.["Assistant Professor"] ?? 0,
            associateProfessor: counts.rank?.["Associate Professor"] ?? 0,
            professor: counts.rank?.Professor ?? 0,
            universityProfessor: counts.rank?.["University Professor"] ?? 0,
            bachelors: counts.education?.["Bachelor's Degree"] ?? 0,
            masters: counts.education?.["Master's Degree"] ?? 0,
            doctorate: counts.education?.["Doctorate Degree"] ?? 0,
            total: row.total ?? 0,
          };
        })}
      />
    </div>
  );
}
