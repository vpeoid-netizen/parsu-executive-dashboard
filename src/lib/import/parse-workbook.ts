import ExcelJS from "exceljs";
import { parseFraction, parseRatioOrPercent } from "@/lib/metrics";
import { parseAcademicYearHeader, parseFiscalYear } from "@/lib/periods";
import {
  cellCountZero,
  cellDate,
  cellNumber,
  cellText,
  isCampusHeader,
  isTotalRow,
  parseDateRange,
  parseLooseDate,
} from "@/lib/import/excel-cells";
import { matchCampus, matchCollege } from "@/lib/import/normalize";
import { applyNtpOfficePermanentRevision } from "@/lib/staff-offices";

export type ValidationDraft = {
  severity: "INFO" | "WARNING" | "ERROR" | "CONFLICT";
  code: string;
  message: string;
  sourceRef?: string;
};

export type AuthorContribution = {
  name: string;
  academicRank?: string | null;
  contribution?: number | null;
};

export type ParsedWorkbook = {
  asOfHints: Record<string, string | null>;
  programs: Array<{
    campusCode: string | null;
    collegeCode: string | null;
    campusRaw: string | null;
    collegeRaw: string | null;
    name: string;
    programType: string | null;
    specializedMajor: string | null;
    copcNumber: string | null;
    copcIssuanceDate: Date | null;
    copcRaw: string | null;
    accreditationLevel: string | null;
    accreditationRaw: string | null;
    validityStart: Date | null;
    validityEnd: Date | null;
    validityRaw: string | null;
    accreditable: boolean | null;
    accredited: boolean | null;
    programStatus: string | null;
    phaseOut: boolean;
    remarks: string | null;
    sourceRow: number;
  }>;
  faculty: Array<{
    campusCode: string | null;
    collegeCode: string | null;
    total: number | null;
    counts: Record<string, Record<string, number>>;
    sourceRow: number;
  }>;
  staff: Array<{
    campusCode: string | null;
    department: string | null;
    office: string | null;
    unit: string | null;
    total: number | null;
    counts: Record<string, Record<string, number>>;
    sourceRow: number;
  }>;
  enrollment: Array<{
    campusCode: string | null;
    collegeCode: string | null;
    programName: string;
    academicYearStart: number;
    academicYearEnd: number;
    semester: number;
    headcount: number | null;
    sourceRow: number;
  }>;
  licensure: Array<{
    campusCode: string | null;
    programName: string;
    examMonth: string | null;
    fiscalYear: number;
    firstTimeTakers: number | null;
    firstTimePassers: number | null;
    passingRate: number | null;
    isTotalRow: boolean;
    sourceRow: number;
  }>;
  awards: Array<{
    recipient: string;
    programName: string | null;
    eventName: string | null;
    awardRank: string | null;
    occurredOn: Date | null;
    occurredRaw: string | null;
    sourceRow: number;
  }>;
  employability: Array<{
    cohortLabel: string;
    collegeCode: string | null;
    collegeName: string;
    graduates: number | null;
    employed: number | null;
    rate: number | null;
    rawValue: string | null;
    sourceRow: number;
  }>;
  performance: Array<{
    programMfo: string;
    indicatorType: string;
    title: string;
    fiscalYear: number;
    targetRaw: string | null;
    targetValue: number | null;
    accomplishmentRaw: string | null;
    accomplishmentValue: number | null;
    numerator: number | null;
    denominator: number | null;
    asOfDate: Date | null;
    isPartial: boolean;
    sourceRow: number;
  }>;
  researchCompleted: Array<{
    fiscalYear: number;
    quarter: number | null;
    title: string;
    authors: AuthorContribution[];
    sourceRow: number;
  }>;
  researchUtilization: Array<{
    fiscalYear: number;
    collegeCode: string | null;
    productName: string | null;
    researchTitle: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    authors: AuthorContribution[];
    beneficiary: string | null;
    patentOrDescription: string | null;
    sourceRow: number;
  }>;
  researchPublications: Array<{
    fiscalYear: number;
    title: string;
    authors: AuthorContribution[];
    sourceRow: number;
  }>;
  extensionPrograms: Array<{
    title: string;
    approvedAt: Date | null;
    implementers: string | null;
    sourceRow: number;
  }>;
  issues: ValidationDraft[];
};

function accreditationMeta(raw: string | null): {
  level: string | null;
  accreditable: boolean | null;
  accredited: boolean | null;
  status: string | null;
  remarks: string | null;
} {
  if (!raw) {
    return { level: null, accreditable: null, accredited: null, status: null, remarks: null };
  }
  const text = raw.replace(/\s+/g, " ").trim();
  const upper = text.toUpperCase();
  if (upper.includes("NEW PROGRAM")) {
    return {
      level: null,
      accreditable: false,
      accredited: false,
      status: "New program",
      remarks: text,
    };
  }
  if (upper.includes("NOT ACCREDITABLE")) {
    return {
      level: null,
      accreditable: false,
      accredited: false,
      status: "Not accreditable",
      remarks: text,
    };
  }
  const levelMatch = text.match(/Level\s+(IV|III|II|I)[^,]*/i);
  return {
    level: levelMatch ? levelMatch[0].replace(/\s+/g, " ").trim() : null,
    accreditable: true,
    accredited: /accredited/i.test(text),
    status: "Accredited",
    remarks: text,
  };
}

function pickCount(ws: ExcelJS.Worksheet, row: number, col: number): number | undefined {
  const value = cellNumber(ws, row, col);
  return value === null ? undefined : value;
}

export async function parseWorkbook(filePath: string): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const result: ParsedWorkbook = {
    asOfHints: {},
    programs: [],
    faculty: [],
    staff: [],
    enrollment: [],
    licensure: [],
    awards: [],
    employability: [],
    performance: [],
    researchCompleted: [],
    researchUtilization: [],
    researchPublications: [],
    extensionPrograms: [],
    issues: [],
  };

  parsePrograms(workbook, result);
  parseFaculty(workbook, result);
  parseStaff(workbook, result);
  applyStaffSourceRevisions(result);
  parseStudents(workbook, result);
  parsePerformance(workbook, result);
  parseResearchCompleted(workbook, result);
  parseResearchUtilization(workbook, result);
  parseResearchPublications(workbook, result);
  parseExtension(workbook, result);
  applyLicensureSummaryTotals(result);
  addCrossSheetIssues(result);
  return result;
}

function isLicensurePerformanceRow(title: string) {
  return /first-time licensure/i.test(title);
}

/** Years whose university total should follow the performance summary, not the detailed worksheet. */
export const LICENSURE_SUMMARY_TOTAL_YEARS = [2025] as const;

function applyLicensureSummaryTotals(result: ParsedWorkbook) {
  for (const year of LICENSURE_SUMMARY_TOTAL_YEARS) {
    const detail = result.licensure.find((row) => row.fiscalYear === year && row.isTotalRow);
    const summary = result.performance.find((row) => row.fiscalYear === year && isLicensurePerformanceRow(row.title));
    if (!detail || !summary) continue;
    if (summary.denominator == null || summary.numerator == null) continue;
    if (detail.firstTimeTakers === summary.denominator && detail.firstTimePassers === summary.numerator) continue;
    result.issues.push({
      severity: "INFO",
      code: "LICENSURE_TOTAL_FROM_PERFORMANCE",
      message: `FY ${year} university licensure total uses the university performance summary (${summary.numerator}/${summary.denominator}) instead of the detailed worksheet (${detail.firstTimePassers}/${detail.firstTimeTakers}). Program-level rows remain from the detailed worksheet.`,
      sourceRef: `licensure FY ${year}`,
    });
    detail.firstTimeTakers = summary.denominator;
    detail.firstTimePassers = summary.numerator;
    detail.passingRate = summary.accomplishmentValue;
  }
}

function parsePrograms(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("2 Academic Programs");
  if (!ws) {
    result.issues.push({
      severity: "ERROR",
      code: "MISSING_SHEET",
      message: "Academic Programs worksheet was not found.",
    });
    return;
  }
  result.asOfHints.programs = cellText(ws, 2, 1);
  let campusRaw: string | null = null;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber < 8) return;
    const rawName = cellText(ws, rowNumber, 4);
    if (!rawName) return;
    if (/^\*\s*[-–—]/.test(rawName) || /^for phasing out$/i.test(rawName.trim())) return;
    campusRaw = cellText(ws, rowNumber, 2) ?? campusRaw;
    const collegeRaw = cellText(ws, rowNumber, 3);
    const copcRaw = cellText(ws, rowNumber, 7);
    const accreditationRaw = cellText(ws, rowNumber, 9);
    const validityRaw = cellText(ws, rowNumber, 10);
    const meta = accreditationMeta(accreditationRaw);
    const phaseOut = /\*/.test(rawName) || /phasing out/i.test(rawName);
    const name = rawName.replace(/\s*\*+\s*$/g, "").trim();
    result.programs.push({
      campusCode: matchCampus(campusRaw),
      collegeCode: matchCollege(collegeRaw),
      campusRaw,
      collegeRaw,
      name,
      programType: cellText(ws, rowNumber, 5),
      specializedMajor: cellText(ws, rowNumber, 6),
      copcNumber: copcRaw,
      copcIssuanceDate: parseLooseDate(cellText(ws, rowNumber, 8)) ?? cellDate(ws, rowNumber, 8),
      copcRaw,
      accreditationLevel: meta.level,
      accreditationRaw,
      validityStart: parseDateRange(validityRaw).start,
      validityEnd: parseDateRange(validityRaw).end,
      validityRaw,
      accreditable: meta.accreditable,
      accredited: meta.accredited,
      programStatus: meta.status,
      phaseOut,
      remarks: meta.remarks,
      sourceRow: rowNumber,
    });
  });
}

function parseFaculty(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("3 Faculty Members");
  if (!ws) return;
  result.asOfHints.faculty = cellText(ws, 2, 1);
  let campusRaw: string | null = null;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber < 7) return;
    const collegeRaw = cellText(ws, rowNumber, 3);
    const campusCell = cellText(ws, rowNumber, 2);
    if (campusCell) campusRaw = campusCell;
    if (!collegeRaw && !campusCell) return;
    if (!collegeRaw) return;
    const counts = {
      appointment: {
        Permanent: pickCount(ws, rowNumber, 4),
        Temporary: pickCount(ws, rowNumber, 5),
        COS: pickCount(ws, rowNumber, 6),
      },
      rank: {
        Instructor: pickCount(ws, rowNumber, 7),
        "Assistant Professor": pickCount(ws, rowNumber, 8),
        "Associate Professor": pickCount(ws, rowNumber, 9),
        Professor: pickCount(ws, rowNumber, 10),
        "University Professor": pickCount(ws, rowNumber, 11),
      },
      education: {
        "Bachelor's Degree": pickCount(ws, rowNumber, 12),
        "Master's Degree": pickCount(ws, rowNumber, 13),
        "Doctorate Degree": pickCount(ws, rowNumber, 14),
      },
    };
    const compactCounts: Record<string, Record<string, number>> = {};
    for (const [group, values] of Object.entries(counts)) {
      const next: Record<string, number> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined) next[key] = value;
      }
      if (Object.keys(next).length) compactCounts[group] = next;
    }
    const total = cellNumber(ws, rowNumber, 15);
    const appointmentSum = Object.values(compactCounts.appointment ?? {}).reduce((a, b) => a + b, 0);
    if (total !== null && Object.keys(compactCounts.appointment ?? {}).length && appointmentSum !== total) {
      result.issues.push({
        severity: "WARNING",
        code: "FACULTY_APPOINTMENT_TOTAL_MISMATCH",
        message: `Faculty appointment subtotal (${appointmentSum}) does not equal the supplied total (${total}) for ${collegeRaw}.`,
        sourceRef: `3 Faculty Members!A${rowNumber}`,
      });
    }
    const rankSum = Object.values(compactCounts.rank ?? {}).reduce((a, b) => a + b, 0);
    if (total !== null && Object.keys(compactCounts.rank ?? {}).length && rankSum !== total) {
      result.issues.push({
        severity: "WARNING",
        code: "FACULTY_RANK_TOTAL_MISMATCH",
        message: `Faculty rank subtotal (${rankSum}) does not equal the supplied total (${total}) for ${collegeRaw}.`,
        sourceRef: `3 Faculty Members!A${rowNumber}`,
      });
    }
    result.faculty.push({
      campusCode: matchCampus(campusRaw),
      collegeCode: matchCollege(collegeRaw),
      total,
      counts: compactCounts,
      sourceRow: rowNumber,
    });
  });
}

function applyStaffSourceRevisions(result: ParsedWorkbook) {
  result.staff = applyNtpOfficePermanentRevision(result.staff);
}

function parseStaff(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("4 Non-Teaching Personnel");
  if (!ws) return;
  result.asOfHints.staff = cellText(ws, 2, 1);
  let campusRaw: string | null = null;
  let department: string | null = null;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber < 7) return;
    const campusCell = cellText(ws, rowNumber, 2);
    const deptCell = cellText(ws, rowNumber, 3);
    const office = cellText(ws, rowNumber, 4);
    const unit = cellText(ws, rowNumber, 5);
    if (campusCell) campusRaw = campusCell;
    if (deptCell) department = deptCell;
    const label = office || unit || campusCell;
    if (!label) return;
    if (isTotalRow(campusCell) || isTotalRow(office)) {
      const officialTotal = cellNumber(ws, rowNumber, 14);
      const appointmentTotal =
        (cellNumber(ws, rowNumber, 6) ?? 0) +
        (cellNumber(ws, rowNumber, 7) ?? 0) +
        (cellNumber(ws, rowNumber, 8) ?? 0);
      if (officialTotal !== null && appointmentTotal && officialTotal !== appointmentTotal) {
        result.issues.push({
          severity: "WARNING",
          code: "STAFF_OFFICIAL_TOTAL_MISMATCH",
          message: `Non-teaching personnel official total (${officialTotal}) differs from appointment subtotal (${appointmentTotal}).`,
          sourceRef: `4 Non-Teaching Personnel!A${rowNumber}`,
        });
      }
      return;
    }
    const appointment = {
      Permanent: cellCountZero(ws, rowNumber, 6),
      Casual: cellCountZero(ws, rowNumber, 7),
      "Job Order": cellCountZero(ws, rowNumber, 8),
    };
    const rank: Record<string, number> = {};
    const rankMap = [
      [9, "Aide"],
      [10, "Assistant"],
      [11, "Officer"],
      [12, "Supervising"],
      [13, "Chief"],
    ] as const;
    for (const [col, key] of rankMap) {
      const value = cellCountZero(ws, rowNumber, col);
      if (value > 0) rank[key] = value;
    }
    const appointmentSum = appointment.Permanent + appointment.Casual + appointment["Job Order"];
    result.staff.push({
      campusCode: matchCampus(campusRaw),
      department,
      office,
      unit,
      total: appointmentSum,
      counts: {
        appointment,
        ...(Object.keys(rank).length ? { rank } : {}),
      },
      sourceRow: rowNumber,
    });
  });
}

function parseStudents(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const enroll = workbook.getWorksheet("5 Students - EnrollmentEmployab");
  if (enroll) {
    const periods = [
      { col: 4, header: cellText(enroll, 4, 4) ?? "2024-2025 2nd Sem" },
      { col: 5, header: cellText(enroll, 4, 5) ?? "2025-2026 1st Sem" },
      { col: 6, header: cellText(enroll, 4, 6) ?? "2025-2026 2nd Sem" },
    ].map((item) => ({
      col: item.col,
      parsed: parseAcademicYearHeader(item.header.replace(/sem/i, " Semester")),
      header: item.header,
    }));
    let inProgramTable = true;
    enroll.eachRow((row, rowNumber) => {
      if (rowNumber < 5) return;
      const campusRaw = cellText(enroll, rowNumber, 1);
      if (campusRaw && /summary|employability/i.test(campusRaw)) {
        inProgramTable = false;
        return;
      }
      if (!inProgramTable) return;
      const programName = cellText(enroll, rowNumber, 3);
      if (!programName || !campusRaw || /summary|total|employability|college/i.test(campusRaw)) {
        return;
      }
      if (campusRaw.toUpperCase() === "CAMPUS") return;
      if (/^[\d,.]+$/.test(programName)) return;
      const collegeRaw = cellText(enroll, rowNumber, 2);
      for (const period of periods) {
        if (!period.parsed) continue;
        result.enrollment.push({
          campusCode: matchCampus(campusRaw),
          collegeCode: matchCollege(collegeRaw),
          programName,
          academicYearStart: period.parsed.start,
          academicYearEnd: period.parsed.end,
          semester: period.parsed.semester,
          headcount: cellNumber(enroll, rowNumber, period.col),
          sourceRow: rowNumber,
        });
      }
    });
    let cohortLabel = "AY 2022 Graduates";
    enroll.eachRow((row, rowNumber) => {
      const maybeCohort = cellText(enroll, rowNumber, 2);
      if (maybeCohort && /graduates/i.test(maybeCohort)) cohortLabel = maybeCohort;
      const collegeName = cellText(enroll, rowNumber, 2);
      const raw = cellText(enroll, rowNumber, 3);
      if (!collegeName || !raw || !raw.includes("/")) return;
      if (/^colleges?$/i.test(collegeName.trim())) return;
      if (/college/i.test(collegeName) === false) return;
      const fraction = parseFraction(raw);
      result.employability.push({
        cohortLabel,
        collegeCode: matchCollege(collegeName),
        collegeName,
        graduates: fraction.denominator,
        employed: fraction.numerator,
        rate: parseRatioOrPercent(raw),
        rawValue: raw,
        sourceRow: rowNumber,
      });
    });
  }

  const licensure = workbook.getWorksheet("5 Students - Licensure ExamAwar");
  if (!licensure) return;
  let fiscalYear = 2024;
  let campusRaw: string | null = null;
  let inAwards = false;
  let currentAward: ParsedWorkbook["awards"][number] | null = null;
  licensure.eachRow((row, rowNumber) => {
    const a = cellText(licensure, rowNumber, 1);
    const b = cellText(licensure, rowNumber, 2);
    if (a && /^awards$/i.test(a)) {
      inAwards = true;
      return;
    }
    const fy = a ? parseFiscalYear(a) : null;
    if (fy && !inAwards) {
      fiscalYear = fy;
      campusRaw = null;
      return;
    }
    if (!inAwards) {
      if (a && isCampusHeader(a)) {
        campusRaw = a;
        return;
      }
      if (!a || /undergraduate programs|performances in licensure/i.test(a)) return;
      result.licensure.push({
        campusCode: matchCampus(campusRaw),
        programName: a,
        examMonth: b,
        fiscalYear,
        firstTimeTakers: cellNumber(licensure, rowNumber, 3),
        firstTimePassers: cellNumber(licensure, rowNumber, 4),
        passingRate: cellNumber(licensure, rowNumber, 5),
        isTotalRow: isTotalRow(a),
        sourceRow: rowNumber,
      });
      return;
    }
    if (/name of students|fy \d{4}/i.test(a ?? "") || /name of students/i.test(a ?? "")) return;
    const recipient = a ?? currentAward?.recipient ?? null;
    const awardRank = cellText(licensure, rowNumber, 4);
    const eventName = cellText(licensure, rowNumber, 3) ?? currentAward?.eventName ?? null;
    if (!recipient || !awardRank) {
      if (recipient) {
        currentAward = {
          recipient,
          programName: b ?? currentAward?.programName ?? null,
          eventName,
          awardRank: currentAward?.awardRank ?? null,
          occurredOn: currentAward?.occurredOn ?? null,
          occurredRaw: currentAward?.occurredRaw ?? null,
          sourceRow: rowNumber,
        };
      }
      return;
    }
    const occurredRaw = cellText(licensure, rowNumber, 5);
    const award = {
      recipient,
      programName: b ?? currentAward?.programName ?? null,
      eventName,
      awardRank,
      occurredOn: parseLooseDate(occurredRaw) ?? cellDate(licensure, rowNumber, 5),
      occurredRaw,
      sourceRow: rowNumber,
    };
    result.awards.push(award);
    currentAward = award;
  });
}

function parsePerformance(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("7 University Peformance") ?? workbook.getWorksheet("7 University Performance");
  if (!ws) return;
  let programMfo = "Unspecified";
  let indicatorType = "Indicator";
  const yearMeta = [
    { year: 2024, targetCol: 2, valueCol: 3, partial: false, asOf: null as Date | null },
    { year: 2025, targetCol: 4, valueCol: 5, partial: false, asOf: null },
    {
      year: 2026,
      targetCol: 6,
      valueCol: 7,
      partial: true,
      asOf: new Date("2026-06-30T00:00:00"),
    },
  ];
  ws.eachRow((row, rowNumber) => {
    const title = cellText(ws, rowNumber, 1);
    if (!title) return;
    if (/higher education program/i.test(title)) {
      programMfo = "Higher Education Program";
      return;
    }
    if (/advanced education program/i.test(title)) {
      programMfo = "Advanced Education Program";
      return;
    }
    if (/research program/i.test(title)) {
      programMfo = "Research Program";
      return;
    }
    if (/technical advisory extension program/i.test(title)) {
      programMfo = "Technical Advisory Extension Program";
      return;
    }
    if (/outcome indicators/i.test(title)) {
      indicatorType = "Outcome Indicator";
      return;
    }
    if (/output indicators/i.test(title)) {
      indicatorType = "Output Indicator";
      return;
    }
    if (/^[a-d]\./i.test(title) || /indicators/i.test(title)) return;
    for (const year of yearMeta) {
      const targetRaw = cellText(ws, rowNumber, year.targetCol);
      const accomplishmentRaw = cellText(ws, rowNumber, year.valueCol);
      const targetValue = parseRatioOrPercent(targetRaw) ?? cellNumber(ws, rowNumber, year.targetCol);
      const accomplishmentValue =
        parseRatioOrPercent(accomplishmentRaw) ?? cellNumber(ws, rowNumber, year.valueCol);
      if (targetRaw === null && accomplishmentRaw === null) continue;
      const fraction = parseFraction(accomplishmentRaw);
      result.performance.push({
        programMfo,
        indicatorType,
        title,
        fiscalYear: year.year,
        targetRaw,
        targetValue,
        accomplishmentRaw,
        accomplishmentValue,
        numerator: fraction.numerator,
        denominator: fraction.denominator,
        asOfDate: year.asOf,
        isPartial: year.partial,
        sourceRow: rowNumber,
      });
    }
  });
}

function isResearchSectionHeader(value: string | null) {
  if (!value) return false;
  return /list of completed|research\/study title|^no\.?$|research publication|^academic rank$/i.test(value);
}

function normalizeResearchTitle(title: string) {
  return title.replace(/\s+/g, " ").trim();
}

function parseAuthoredTitleSheet(
  ws: ExcelJS.Worksheet,
  resultList: Array<{
    fiscalYear: number;
    quarter?: number | null;
    title: string;
    authors: AuthorContribution[];
    sourceRow: number;
  }>,
  options: { defaultYear: number; trackQuarter: boolean },
) {
  let fiscalYear = options.defaultYear;
  let quarter: number | null = null;
  let current: (typeof resultList)[number] | null = null;
  const index = new Map<string, (typeof resultList)[number]>();

  ws.eachRow((_row, rowNumber) => {
    const a = cellText(ws, rowNumber, 1);
    const titleRaw = cellText(ws, rowNumber, 2);
    const author = cellText(ws, rowNumber, 3);
    const fy = a ? parseFiscalYear(a) : null;
    if (fy) {
      fiscalYear = fy;
      quarter = null;
      current = null;
      return;
    }
    if (options.trackQuarter && a && /quarter/i.test(a)) {
      const number = a.match(/one|two|three|four|1|2|3|4/i)?.[0];
      const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };
      quarter = number ? map[number.toLowerCase()] ?? Number(number) : null;
      current = null;
      return;
    }
    if (isResearchSectionHeader(a) || isResearchSectionHeader(titleRaw)) return;

    const title = titleRaw ? normalizeResearchTitle(titleRaw) : null;
    if (title) {
      const key = `${fiscalYear}::${title.toLowerCase()}`;
      const existing = index.get(key);
      if (existing) {
        current = existing;
      } else {
        current = {
          fiscalYear,
          ...(options.trackQuarter ? { quarter } : {}),
          title,
          authors: [],
          sourceRow: rowNumber,
        };
        index.set(key, current);
        resultList.push(current);
      }
    }
    if (author && current && !isResearchSectionHeader(author)) {
      current.authors.push({
        name: author,
        academicRank: cellText(ws, rowNumber, 4),
        contribution: cellNumber(ws, rowNumber, 5),
      });
    }
  });
}

function parseResearchCompleted(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("8 Research Completed");
  if (!ws) return;
  parseAuthoredTitleSheet(ws, result.researchCompleted, { defaultYear: 2024, trackQuarter: true });
}

function parseResearchUtilization(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("8 Research Utilization");
  if (!ws) return;
  let fiscalYear = 2024;
  let current: ParsedWorkbook["researchUtilization"][number] | null = null;
  const index = new Map<string, ParsedWorkbook["researchUtilization"][number]>();
  ws.eachRow((_row, rowNumber) => {
    const collegeRaw = cellText(ws, rowNumber, 1);
    if (collegeRaw && /^FY\s*\d{4}\s*$/i.test(collegeRaw.trim())) {
      fiscalYear = parseFiscalYear(collegeRaw) ?? fiscalYear;
      current = null;
      return;
    }
    if (
      collegeRaw &&
      (/^FY\s*\d{4}\s*[-–—]/i.test(collegeRaw) ||
        /list of research utilization/i.test(collegeRaw) ||
        /college/i.test(collegeRaw))
    ) {
      return;
    }
    const productRaw = cellText(ws, rowNumber, 3);
    if (productRaw && /product name|research title/i.test(productRaw)) return;

    const seq = cellNumber(ws, rowNumber, 2);
    const product = productRaw ? normalizeResearchTitle(productRaw) : null;
    const author = cellText(ws, rowNumber, 6);
    if (product && seq !== null) {
      const key = `${fiscalYear}::${seq}`;
      const existing = index.get(key);
      if (existing) {
        current = existing;
      } else {
        current = {
          fiscalYear,
          collegeCode: matchCollege(collegeRaw),
          productName: product,
          researchTitle: product,
          startedAt: cellDate(ws, rowNumber, 4),
          completedAt: cellDate(ws, rowNumber, 5),
          authors: [],
          beneficiary: cellText(ws, rowNumber, 9),
          patentOrDescription: cellText(ws, rowNumber, 10),
          sourceRow: rowNumber,
        };
        index.set(key, current);
        result.researchUtilization.push(current);
      }
    }
    if (author && current && !isResearchSectionHeader(author)) {
      current.authors.push({
        name: author.trim(),
        academicRank: cellText(ws, rowNumber, 7),
        contribution: cellNumber(ws, rowNumber, 8),
      });
    }
  });
}

function parseResearchPublications(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("8 Research Publication");
  if (!ws) return;
  parseAuthoredTitleSheet(ws, result.researchPublications, { defaultYear: 2026, trackQuarter: false });
}

function parseExtension(workbook: ExcelJS.Workbook, result: ParsedWorkbook) {
  const ws = workbook.getWorksheet("9 Extension");
  if (!ws) return;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber < 2) return;
    const title = cellText(ws, rowNumber, 2);
    if (!title || /bor-approved/i.test(title)) return;
    result.extensionPrograms.push({
      title,
      approvedAt: cellDate(ws, rowNumber, 3) ?? parseLooseDate(cellText(ws, rowNumber, 3)),
      implementers: cellText(ws, rowNumber, 4),
      sourceRow: rowNumber,
    });
  });
}

function addCrossSheetIssues(result: ParsedWorkbook) {
  const copcCount = result.programs.filter((program) => program.copcNumber).length;
  const accreditable = result.programs.filter((program) => program.accreditable).length;
  const accredited = result.programs.filter((program) => program.accredited).length;
  if (result.programs.length !== 42) {
    result.issues.push({
      severity: "WARNING",
      code: "PROGRAM_COUNT_CHECKPOINT",
      message: `Academic program count is ${result.programs.length}; workbook checkpoint is 42.`,
    });
  }
  if (copcCount !== 42) {
    result.issues.push({
      severity: "INFO",
      code: "COPC_COUNT_CHECKPOINT",
      message: `Programs with COPC/authority references: ${copcCount}; workbook checkpoint is 42.`,
    });
  }
  if (accreditable !== 32 || accredited !== 32) {
    result.issues.push({
      severity: "INFO",
      code: "ACCREDITATION_CHECKPOINT",
      message: `Parsed accreditable=${accreditable}, accredited=${accredited}; workbook checkpoint is 32 / 32.`,
    });
  }

  for (const year of [2024, 2025, 2026]) {
    const detail = result.licensure.find((row) => row.fiscalYear === year && row.isTotalRow);
    const summary = result.performance.find(
      (row) => row.fiscalYear === year && isLicensurePerformanceRow(row.title),
    );
    if (detail && summary && detail.firstTimeTakers && summary.denominator) {
      if (detail.firstTimeTakers !== summary.denominator || detail.firstTimePassers !== summary.numerator) {
        result.issues.push({
          severity: "CONFLICT",
          code: "SOURCE_CONFLICT_LICENSURE",
          message: `Source conflict detected for FY ${year} licensure totals. Detailed worksheet: ${detail.firstTimePassers}/${detail.firstTimeTakers}; university performance summary: ${summary.numerator}/${summary.denominator}. Administrator resolution is required before replacing a published KPI.`,
          sourceRef: `licensure FY ${year}`,
        });
      }
    }
  }

  const employabilityGrads = result.employability.reduce((sum, row) => sum + (row.graduates ?? 0), 0);
  const employabilityEmployed = result.employability.reduce((sum, row) => sum + (row.employed ?? 0), 0);
  const performanceEmployability = result.performance.find((row) =>
    /graduates \(2 yrs prior\).*employed/i.test(row.title) && row.fiscalYear === 2024,
  );
  if (
    performanceEmployability?.denominator &&
    employabilityGrads &&
    (performanceEmployability.denominator !== employabilityGrads ||
      performanceEmployability.numerator !== employabilityEmployed)
  ) {
    result.issues.push({
      severity: "CONFLICT",
      code: "SOURCE_CONFLICT_EMPLOYABILITY",
      message: `Source conflict detected for employability. College worksheet: ${employabilityEmployed}/${employabilityGrads}; university performance FY 2024: ${performanceEmployability.numerator}/${performanceEmployability.denominator}.`,
    });
  }
}
