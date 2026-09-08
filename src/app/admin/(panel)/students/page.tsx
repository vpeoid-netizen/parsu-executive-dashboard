import {
  saveAwardsAction,
  saveEmployabilityAction,
  saveEnrollmentAction,
  saveLicensureAction,
} from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { dateToInput } from "@/lib/admin/editor";
import { campusCollegeOptions } from "@/lib/admin/reference-options";
import { prisma } from "@/lib/db";

const SEMESTER_OPTIONS = [
  { value: "1", label: "First Semester" },
  { value: "2", label: "Second Semester" },
  { value: "3", label: "Midyear" },
];

export default async function StudentsAdminPage() {
  const [{ campuses, colleges }, enrollment, licensure, awards, employability] = await Promise.all([
    campusCollegeOptions(),
    prisma.enrollmentObservation.findMany({
      where: { status: "PUBLISHED" },
      include: { period: true },
      orderBy: { programName: "asc" },
    }),
    prisma.licensureObservation.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ fiscalYear: "desc" }, { programName: "asc" }] }),
    prisma.studentAward.findMany({ where: { status: "PUBLISHED" }, orderBy: { recipient: "asc" } }),
    prisma.employabilityObservation.findMany({ where: { status: "PUBLISHED" }, orderBy: { collegeName: "asc" } }),
  ]);

  return (
    <div className="space-y-12">
      <AdminModuleIntro
        title="Student datasets"
        description="Edit enrollment, licensure, awards, and employability in labeled tables. Each save publishes that section to the public Students pages."
      />
      <nav className="flex flex-wrap gap-2 text-sm">
        {[
          ["#enrollment", "Enrollment"],
          ["#licensure", "Licensure"],
          ["#awards", "Awards"],
          ["#employability", "Employability"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="btn btn-ghost">
            {label}
          </a>
        ))}
      </nav>

      <div id="enrollment">
        <WorkbookEditor
          title="Enrollment by program"
          description="One row per program and semester. Academic year start 2025 with end 2026 is AY 2025–2026."
          excelSheet="5 Students - EnrollmentEmployab"
          saveAction={saveEnrollmentAction}
          addLabel="Add enrollment row"
          addRowDefaults={{ academicYearStart: 2025, academicYearEnd: 2026, semester: "1" }}
          columns={[
            { key: "campusId", header: "Campus", type: "select", options: campuses, width: "11rem" },
            { key: "collegeId", header: "College", type: "select", options: colleges, width: "14rem" },
            { key: "programName", header: "Program", type: "text", required: true, width: "18rem" },
            { key: "academicYearStart", header: "AY start", type: "number", required: true, width: "7rem" },
            { key: "academicYearEnd", header: "AY end", type: "number", width: "7rem" },
            { key: "semester", header: "Semester", type: "select", options: SEMESTER_OPTIONS, width: "11rem" },
            { key: "headcount", header: "Headcount", type: "number", min: 0, sumFooter: true, width: "8rem" },
          ]}
          rows={enrollment.map((row) => ({
            id: row.id,
            campusId: row.campusId ?? "",
            collegeId: row.collegeId ?? "",
            programName: row.programName,
            academicYearStart: row.period?.academicYearStart ?? "",
            academicYearEnd: row.period?.academicYearEnd ?? "",
            semester: String(row.period?.semester ?? "1"),
            headcount: row.headcount,
          }))}
        />
      </div>

      <div id="licensure">
        <WorkbookEditor
          title="Licensure examinations"
          description="First-time takers and passers. Passing rate is computed when left blank (passers ÷ takers). Mark summary rows so they are not double-counted."
          excelSheet="5 Students - Licensure ExamAwar"
          saveAction={saveLicensureAction}
          addLabel="Add exam row"
          columns={[
            { key: "campusId", header: "Campus", type: "select", options: campuses, width: "11rem" },
            { key: "programName", header: "Program / board exam", type: "text", required: true, width: "16rem" },
            { key: "examMonth", header: "Exam month", type: "text", width: "10rem" },
            { key: "fiscalYear", header: "Fiscal year", type: "number", width: "8rem" },
            { key: "firstTimeTakers", header: "First-time takers", type: "number", min: 0, width: "9rem" },
            { key: "firstTimePassers", header: "First-time passers", type: "number", min: 0, width: "9rem" },
            { key: "passingRate", header: "Passing rate", type: "number", step: "0.0001", hint: "0.66 = 66%", width: "8rem" },
            { key: "isTotalRow", header: "Summary total", type: "checkbox", width: "8rem" },
          ]}
          rows={licensure.map((row) => ({
            id: row.id,
            campusId: row.campusId ?? "",
            programName: row.programName,
            examMonth: row.examMonth ?? "",
            fiscalYear: row.fiscalYear,
            firstTimeTakers: row.firstTimeTakers,
            firstTimePassers: row.firstTimePassers,
            passingRate: row.passingRate,
            isTotalRow: row.isTotalRow,
          }))}
        />
      </div>

      <div id="awards">
        <WorkbookEditor
          title="Student awards"
          description="Encode recipients, events, and ranks as they appear on the awards worksheet."
          excelSheet="5 Students - Licensure ExamAwar"
          saveAction={saveAwardsAction}
          addLabel="Add award"
          columns={[
            { key: "recipient", header: "Recipient", type: "text", required: true, width: "14rem" },
            { key: "programName", header: "Program", type: "text", width: "14rem" },
            { key: "eventName", header: "Event", type: "text", width: "16rem" },
            { key: "awardRank", header: "Rank / award", type: "text", width: "10rem" },
            { key: "occurredOn", header: "Date", type: "date", width: "11rem" },
            { key: "occurredRaw", header: "Date as written", type: "text", width: "12rem" },
          ]}
          rows={awards.map((row) => ({
            id: row.id,
            recipient: row.recipient,
            programName: row.programName ?? "",
            eventName: row.eventName ?? "",
            awardRank: row.awardRank ?? "",
            occurredOn: dateToInput(row.occurredOn),
            occurredRaw: row.occurredRaw ?? "",
          }))}
        />
      </div>

      <div id="employability">
        <WorkbookEditor
          title="Graduate employability"
          description="College tracer figures. Rate is computed when left blank (employed ÷ graduates)."
          excelSheet="5 Students - EnrollmentEmployab"
          saveAction={saveEmployabilityAction}
          addLabel="Add college row"
          columns={[
            { key: "cohortLabel", header: "Cohort", type: "text", width: "10rem" },
            { key: "collegeId", header: "College", type: "select", options: colleges, width: "14rem" },
            { key: "collegeName", header: "College name (if unlisted)", type: "text", width: "14rem" },
            { key: "graduates", header: "Graduates", type: "number", min: 0, sumFooter: true, width: "8rem" },
            { key: "employed", header: "Employed", type: "number", min: 0, sumFooter: true, width: "8rem" },
            { key: "rate", header: "Rate", type: "number", step: "0.0001", hint: "0.26 = 25.99%", width: "8rem" },
            { key: "rawValue", header: "Value as written", type: "text", width: "10rem" },
          ]}
          rows={employability.map((row) => ({
            id: row.id,
            cohortLabel: row.cohortLabel,
            collegeId: row.collegeId ?? "",
            collegeName: row.collegeName,
            graduates: row.graduates,
            employed: row.employed,
            rate: row.rate,
            rawValue: row.rawValue ?? "",
          }))}
        />
      </div>
    </div>
  );
}
