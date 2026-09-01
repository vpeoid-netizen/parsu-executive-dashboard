import { DatasetStatus, PeriodType, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  ACADEMIC_RANKS,
  CAMPUSES,
  COLLEGES,
  PUBLIC_DOCUMENTS,
  EDUCATION_LEVELS,
  FACULTY_APPOINTMENTS,
  STAFF_APPOINTMENTS,
  STAFF_RANKS,
} from "@/lib/constants";
import { classifyAchievement, meetingTarget } from "@/lib/metrics";
import { formatPeriod, fiscalYearLabel } from "@/lib/periods";
import { LICENSURE_SUMMARY_TOTAL_YEARS, type ParsedWorkbook } from "@/lib/import/parse-workbook";
import {
  HISTORY_BODY,
  HISTORY_TITLE,
  VMGO_BODY,
  VMGO_TITLE,
} from "@/lib/about/content";
import officialsSeed from "@/lib/about/officials.json";
import { awardFiscalYear, enrollmentPeriodFiscalYear, EXECUTIVE_CURRENT_YEAR, EXECUTIVE_KPI_YEARS } from "@/lib/kpi-years";

const METRICS = [
  { code: "CAMPUSES_TOTAL", title: "Number of Campuses", shortTitle: "Number of Campuses", unit: "count", format: "integer", groupName: "About ParSU", detailsHref: "/about/campuses", displayOrder: 1, homepageVisible: true },
  { code: "COLLEGES_TOTAL", title: "Number of Colleges", shortTitle: "Number of Colleges", unit: "count", format: "integer", groupName: "About ParSU", detailsHref: "/about/colleges", displayOrder: 2, homepageVisible: true },
  { code: "ACADEMIC_PROGRAMS_TOTAL", title: "Total Academic Programs", shortTitle: "Number of programs", unit: "count", format: "integer", groupName: "Academics", detailsHref: "/academics/programs", displayOrder: 10, homepageVisible: true },
  { code: "PROGRAMS_WITH_COPC", title: "Programs with COPC", shortTitle: "With COPC", unit: "count", format: "integer", groupName: "Academics", detailsHref: "/academics/programs", displayOrder: 11 },
  { code: "ACCREDITABLE_PROGRAMS", title: "Accreditable Programs", shortTitle: "Accreditable", unit: "count", format: "integer", groupName: "Academics", detailsHref: "/academics/programs", displayOrder: 12 },
  { code: "ACCREDITED_PROGRAMS", title: "Accredited Programs", shortTitle: "Accredited", unit: "count", format: "integer", groupName: "Academics", detailsHref: "/academics/programs", displayOrder: 13 },
  { code: "FACULTY_TOTAL", title: "Total Faculty Members", shortTitle: "Number of Faculty Members", unit: "count", format: "integer", groupName: "Personnel", detailsHref: "/personnel/faculty", displayOrder: 20, homepageVisible: true },
  { code: "FACULTY_PERMANENT", title: "Permanent Faculty", shortTitle: "Permanent Faculty", unit: "count", format: "integer", groupName: "Personnel", detailsHref: "/personnel/faculty", displayOrder: 21 },
  { code: "NTP_TOTAL", title: "Total Non-Teaching Personnel", shortTitle: "Number of Non-Teaching Personnel", unit: "count", format: "integer", groupName: "Personnel", detailsHref: "/personnel/non-teaching", displayOrder: 22, homepageVisible: true },
  { code: "ENROLLMENT_CURRENT", title: "Current Enrollment", shortTitle: "Enrollment", unit: "count", format: "integer", groupName: "Students", detailsHref: "/students/enrollment", displayOrder: 30, homepageVisible: true },
  { code: "LICENSURE_PASSING_RATE", title: "Licensure Examination Passing Rate", shortTitle: "Licensure Examination Performance", unit: "percent", format: "percent", groupName: "Students", detailsHref: "/students/licensure", displayOrder: 31, homepageVisible: true },
  { code: "EMPLOYABILITY_RATE", title: "Graduate Employability Rate", shortTitle: "Employability", unit: "percent", format: "percent", groupName: "Students", detailsHref: "/performance#indicator-2-percentage-of-graduates-2-yrs-prior-that-are-employed", displayOrder: 32, homepageVisible: true },
  { code: "STUDENT_AWARDS", title: "Student Awards", shortTitle: "Awards", unit: "count", format: "integer", groupName: "Students", detailsHref: "/students/awards", displayOrder: 33 },
  { code: "PERFORMANCE_MEETING_TARGET", title: "Indicators Meeting Target", shortTitle: "On Target", unit: "count", format: "integer", groupName: "Performance", detailsHref: "/performance", displayOrder: 40, homepageVisible: true },
  { code: "RESEARCH_COMPLETED", title: "Completed Research", shortTitle: "Completed Research", unit: "count", format: "integer", groupName: "Research", detailsHref: "/research/completed", displayOrder: 50, homepageVisible: true },
  { code: "RESEARCH_PUBLICATIONS", title: "Research Publications", shortTitle: "Publications", unit: "count", format: "integer", groupName: "Research", detailsHref: "/research/publications", displayOrder: 51, homepageVisible: true },
  { code: "RESEARCH_UTILIZED", title: "Research Outputs Utilized", shortTitle: "Utilized", unit: "count", format: "integer", groupName: "Research", detailsHref: "/research/utilization", displayOrder: 52, homepageVisible: true },
  { code: "EXTENSION_PROGRAMS", title: "Extension Programs", shortTitle: "Extension Programs", unit: "count", format: "integer", groupName: "Extension", detailsHref: "/performance#indicator-2-number-of-extension-programs-organized-and-supported-consistent-with-the-suc-s-mandated-and-priority-programs", displayOrder: 60, homepageVisible: true },
] as const;

export async function ensureReferenceData() {
  for (const campus of CAMPUSES) {
    await prisma.campus.upsert({
      where: { code: campus.code },
      update: { name: campus.name },
      create: { code: campus.code, name: campus.name, shortName: campus.name.replace(" Campus", "") },
    });
  }
  const campusRecords = await prisma.campus.findMany();
  const campusByCode = Object.fromEntries(campusRecords.map((item) => [item.code, item]));
  for (const college of COLLEGES) {
    const record = await prisma.college.upsert({
      where: { code: college.code },
      update: { name: college.name },
      create: { code: college.code, name: college.name },
    });
    const aliases = [...new Set([college.abbrev.toLowerCase(), ...college.aliases])];
    for (const alias of aliases) {
      await prisma.collegeAlias.upsert({
        where: { alias },
        update: { collegeId: record.id },
        create: { alias, collegeId: record.id },
      });
    }
  }
  const categories = [
    ...ACADEMIC_RANKS.map((item, index) => ({ type: "ACADEMIC_RANK", ...item, displayOrder: index })),
    ...FACULTY_APPOINTMENTS.map((item, index) => ({ type: "FACULTY_APPOINTMENT", ...item, displayOrder: index })),
    ...EDUCATION_LEVELS.map((item, index) => ({ type: "EDUCATION_LEVEL", ...item, displayOrder: index })),
    ...STAFF_APPOINTMENTS.map((item, index) => ({ type: "STAFF_APPOINTMENT", ...item, displayOrder: index })),
    ...STAFF_RANKS.map((item, index) => ({ type: "STAFF_RANK", ...item, displayOrder: index })),
  ];
  for (const category of categories) {
    await prisma.categoryDefinition.upsert({
      where: { type_code: { type: category.type, code: category.code } },
      update: { name: category.name, displayOrder: category.displayOrder },
      create: category,
    });
  }
  for (const metric of METRICS) {
    await prisma.metricDefinition.upsert({
      where: { code: metric.code },
      update: {
        title: metric.title,
        shortTitle: metric.shortTitle,
        unit: metric.unit,
        format: metric.format,
        groupName: metric.groupName,
        detailsHref: metric.detailsHref,
        displayOrder: metric.displayOrder,
        homepageVisible: "homepageVisible" in metric ? Boolean(metric.homepageVisible) : false,
      },
      create: {
        code: metric.code,
        title: metric.title,
        shortTitle: metric.shortTitle,
        unit: metric.unit,
        format: metric.format,
        groupName: metric.groupName,
        detailsHref: metric.detailsHref,
        displayOrder: metric.displayOrder,
        homepageVisible: "homepageVisible" in metric ? Boolean(metric.homepageVisible) : false,
        higherIsBetter: true,
      },
    });
  }
  return { campusByCode, colleges: await prisma.college.findMany() };
}

async function getOrCreatePeriod(data: {
  type: PeriodType;
  label: string;
  fiscalYear?: number | null;
  academicYearStart?: number | null;
  academicYearEnd?: number | null;
  semester?: number | null;
  quarter?: number | null;
  asOfDate?: Date | null;
  isPartial?: boolean;
  notes?: string | null;
}) {
  const existing = await prisma.reportingPeriod.findFirst({
    where: {
      type: data.type,
      label: data.label,
      fiscalYear: data.fiscalYear ?? null,
      academicYearStart: data.academicYearStart ?? null,
      semester: data.semester ?? null,
      quarter: data.quarter ?? null,
    },
  });
  if (existing) return existing;
  return prisma.reportingPeriod.create({ data });
}

export async function persistWorkbook(parsed: ParsedWorkbook, options: {
  sourceFile: string;
  publish: boolean;
  adminId?: string | null;
}) {
  const { campusByCode, colleges } = await ensureReferenceData();
  const collegeByCode = Object.fromEntries(colleges.map((item) => [item.code, item]));
  const status: DatasetStatus = options.publish ? "PUBLISHED" : "DRAFT";

  async function nextVersion(code: string, title: string, worksheet: string, periodLabel?: string, asOfDate?: Date | null) {
    const dataset = await prisma.dataset.upsert({
      where: { code },
      update: { title },
      create: { code, title, ownerId: options.adminId ?? undefined },
    });
    const last = await prisma.datasetVersion.findFirst({
      where: { datasetId: dataset.id },
      orderBy: { versionNumber: "desc" },
    });
    if (options.publish) {
      await prisma.datasetVersion.updateMany({
        where: { datasetId: dataset.id, status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      });
    }
    return prisma.datasetVersion.create({
      data: {
        datasetId: dataset.id,
        versionNumber: (last?.versionNumber ?? 0) + 1,
        status,
        sourceFile: options.sourceFile,
        worksheet,
        importedAt: new Date(),
        publishedAt: options.publish ? new Date() : null,
        publishedById: options.publish ? options.adminId ?? null : null,
        periodLabel,
        asOfDate: asOfDate ?? null,
      },
    });
  }

  const programsVersion = await nextVersion(
    "academic-programs",
    "Academic Programs",
    "2 Academic Programs",
    "As of latest published snapshot",
  );
  if (options.publish) {
    await prisma.academicProgram.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const program of parsed.programs) {
    await prisma.academicProgram.create({
      data: {
        datasetVersionId: programsVersion.id,
        status,
        campusId: program.campusCode ? campusByCode[program.campusCode]?.id : null,
        collegeId: program.collegeCode ? collegeByCode[program.collegeCode]?.id : null,
        name: program.name,
        programType: program.programType,
        specializedMajor: program.specializedMajor,
        copcNumber: program.copcNumber,
        copcIssuanceDate: program.copcIssuanceDate,
        copcRaw: program.copcRaw,
        accreditationLevel: program.accreditationLevel,
        accreditationRaw: program.accreditationRaw,
        validityStart: program.validityStart,
        validityEnd: program.validityEnd,
        validityRaw: program.validityRaw,
        accreditable: program.accreditable,
        accredited: program.accredited,
        programStatus: program.programStatus,
        phaseOut: program.phaseOut,
        remarks: program.remarks,
        sourceRow: program.sourceRow,
      },
    });
  }

  const facultyVersion = await nextVersion("faculty", "Faculty Members", "3 Faculty Members");
  if (options.publish) {
    await prisma.facultySnapshot.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.faculty) {
    await prisma.facultySnapshot.create({
      data: {
        datasetVersionId: facultyVersion.id,
        status,
        campusId: row.campusCode ? campusByCode[row.campusCode]?.id : null,
        collegeId: row.collegeCode ? collegeByCode[row.collegeCode]?.id : null,
        total: row.total,
        countsJson: JSON.stringify(row.counts),
        sourceRow: row.sourceRow,
      },
    });
  }

  const staffVersion = await nextVersion("non-teaching", "Non-Teaching Personnel", "4 Non-Teaching Personnel");
  if (options.publish) {
    await prisma.staffSnapshot.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.staff) {
    await prisma.staffSnapshot.create({
      data: {
        datasetVersionId: staffVersion.id,
        status,
        campusId: row.campusCode ? campusByCode[row.campusCode]?.id : null,
        department: row.department,
        office: row.office,
        unit: row.unit,
        total: row.total,
        countsJson: JSON.stringify(row.counts),
        sourceRow: row.sourceRow,
      },
    });
  }

  const enrollmentVersion = await nextVersion("enrollment", "Student Enrollment", "5 Students - EnrollmentEmployab");
  if (options.publish) {
    await prisma.enrollmentObservation.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.enrollment) {
    const period = await getOrCreatePeriod({
      type: "SEMESTER",
      label: formatPeriod({
        type: "SEMESTER",
        academicYearStart: row.academicYearStart,
        academicYearEnd: row.academicYearEnd,
        semester: row.semester,
      }),
      academicYearStart: row.academicYearStart,
      academicYearEnd: row.academicYearEnd,
      semester: row.semester,
    });
    await prisma.enrollmentObservation.create({
      data: {
        datasetVersionId: enrollmentVersion.id,
        status,
        campusId: row.campusCode ? campusByCode[row.campusCode]?.id : null,
        collegeId: row.collegeCode ? collegeByCode[row.collegeCode]?.id : null,
        programName: row.programName,
        periodId: period.id,
        headcount: row.headcount,
        sourceRow: row.sourceRow,
      },
    });
  }

  const licensureVersion = await nextVersion("licensure", "Licensure Examinations", "5 Students - Licensure ExamAwar");
  if (options.publish) {
    await prisma.licensureObservation.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.licensure) {
    await prisma.licensureObservation.create({
      data: {
        datasetVersionId: licensureVersion.id,
        status,
        campusId: row.campusCode ? campusByCode[row.campusCode]?.id : null,
        programName: row.programName,
        examMonth: row.examMonth,
        fiscalYear: row.fiscalYear,
        firstTimeTakers: row.firstTimeTakers,
        firstTimePassers: row.firstTimePassers,
        passingRate: row.passingRate,
        isTotalRow: row.isTotalRow,
        sourceRow: row.sourceRow,
      },
    });
  }

  const awardsVersion = await nextVersion("student-awards", "Student Awards", "5 Students - Licensure ExamAwar");
  if (options.publish) {
    await prisma.studentAward.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.awards) {
    await prisma.studentAward.create({
      data: {
        datasetVersionId: awardsVersion.id,
        status,
        recipient: row.recipient,
        programName: row.programName,
        eventName: row.eventName,
        awardRank: row.awardRank,
        occurredOn: row.occurredOn,
        occurredRaw: row.occurredRaw,
        sourceRow: row.sourceRow,
      },
    });
  }

  const employabilityVersion = await nextVersion("employability", "Graduate Employability", "5 Students - EnrollmentEmployab");
  if (options.publish) {
    await prisma.employabilityObservation.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.employability) {
    await prisma.employabilityObservation.create({
      data: {
        datasetVersionId: employabilityVersion.id,
        status,
        cohortLabel: row.cohortLabel,
        collegeId: row.collegeCode ? collegeByCode[row.collegeCode]?.id : null,
        collegeName: (row.collegeCode ? collegeByCode[row.collegeCode]?.name : null) ?? row.collegeName,
        graduates: row.graduates,
        employed: row.employed,
        rate: row.rate,
        rawValue: row.rawValue,
        source: "College tracer / institutional worksheet",
        sourceRow: row.sourceRow,
      },
    });
  }

  const performanceVersion = await nextVersion(
    "university-performance",
    "University Performance",
    "7 University Performance",
    "FY 2024–FY 2026",
    new Date("2026-06-30"),
  );
  if (options.publish) {
    await prisma.performanceObservation.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.performance) {
    const indicator = await prisma.performanceIndicator.upsert({
      where: { code: `${row.programMfo}:${row.title}`.slice(0, 180) },
      update: { programMfo: row.programMfo, indicatorType: row.indicatorType, title: row.title },
      create: {
        code: `${row.programMfo}:${row.title}`.slice(0, 180),
        programMfo: row.programMfo,
        indicatorType: row.indicatorType,
        title: row.title,
      },
    });
    await prisma.performanceObservation.create({
      data: {
        indicatorId: indicator.id,
        datasetVersionId: performanceVersion.id,
        status,
        fiscalYear: row.fiscalYear,
        targetRaw: row.targetRaw,
        targetValue: row.targetValue,
        accomplishmentRaw: row.accomplishmentRaw,
        accomplishmentValue: row.accomplishmentValue,
        numerator: row.numerator,
        denominator: row.denominator,
        asOfDate: row.asOfDate,
        isPartial: row.isPartial,
        sourceRow: row.sourceRow,
      },
    });
  }

  const completedVersion = await nextVersion("research-completed", "Completed Research", "8 Research Completed");
  if (options.publish) {
    await prisma.researchCompletion.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.researchCompleted) {
    await prisma.researchCompletion.create({
      data: {
        datasetVersionId: completedVersion.id,
        status,
        fiscalYear: row.fiscalYear,
        quarter: row.quarter,
        title: row.title,
        authorsJson: JSON.stringify(row.authors),
        sourceRow: row.sourceRow,
      },
    });
  }

  const pubVersion = await nextVersion("research-publications", "Research Publications", "8 Research Publication");
  if (options.publish) {
    await prisma.researchPublication.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.researchPublications) {
    await prisma.researchPublication.create({
      data: {
        datasetVersionId: pubVersion.id,
        status,
        fiscalYear: row.fiscalYear,
        publishedTitle: row.title,
        authorsJson: JSON.stringify(row.authors),
        sourceRow: row.sourceRow,
      },
    });
  }

  const utilVersion = await nextVersion("research-utilization", "Research Utilization", "8 Research Utilization");
  if (options.publish) {
    await prisma.researchUtilization.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.researchUtilization) {
    await prisma.researchUtilization.create({
      data: {
        datasetVersionId: utilVersion.id,
        status,
        fiscalYear: row.fiscalYear,
        collegeCode: row.collegeCode,
        productName: row.productName,
        researchTitle: row.researchTitle,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        authorsJson: JSON.stringify(row.authors),
        beneficiary: row.beneficiary,
        patentOrDescription: row.patentOrDescription,
        sourceRow: row.sourceRow,
      },
    });
  }

  const extensionVersion = await nextVersion("extension-programs", "Extension Programs", "9 Extension");
  if (options.publish) {
    await prisma.extensionProgram.updateMany({ data: { status: "ARCHIVED" }, where: { status: "PUBLISHED" } });
  }
  for (const row of parsed.extensionPrograms) {
    await prisma.extensionProgram.create({
      data: {
        datasetVersionId: extensionVersion.id,
        status,
        title: row.title,
        approvedAt: row.approvedAt,
        office: row.implementers,
      },
    });
  }

  const issueVersion = await nextVersion(
    "workbook-import",
    "Workbook Import Validation",
    "Executive-Dashboard.xlsx",
  );
  for (const issue of parsed.issues) {
    await prisma.validationIssue.create({
      data: {
        datasetVersionId: issueVersion.id,
        severity: issue.severity,
        code: issue.code,
        message: issue.message,
        sourceRef: issue.sourceRef,
      },
    });
  }

  await rebuildMetrics(status);
  await ensureCmsDefaults();
  return { issueVersion, issues: parsed.issues };
}

export async function rebuildMetrics(status: DatasetStatus = "PUBLISHED") {
  const metrics = await prisma.metricDefinition.findMany();
  const byCode = Object.fromEntries(metrics.map((item) => [item.code, item]));
  if (status === "PUBLISHED") {
    await prisma.metricObservation.updateMany({ where: { status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
  }

  async function observe(code: string, data: Prisma.MetricObservationUncheckedCreateInput) {
    const metric = byCode[code];
    if (!metric) return;
    await prisma.metricObservation.create({
      data: { ...data, metricId: metric.id, status },
    });
  }

  async function fiscalPeriod(year: number) {
    const isPartial = year === EXECUTIVE_CURRENT_YEAR;
    const asOfDate = isPartial ? new Date("2026-06-30T00:00:00") : null;
    return getOrCreatePeriod({
      type: "FISCAL_YEAR",
      label: fiscalYearLabel(year, isPartial, asOfDate),
      fiscalYear: year,
      asOfDate,
      isPartial,
    });
  }

  const programs = await prisma.academicProgram.findMany({ where: { status } });
  const faculty = await prisma.facultySnapshot.findMany({ where: { status } });
  const facultyTotal = faculty.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const permanent = faculty.reduce((sum, row) => {
    const counts = JSON.parse(row.countsJson) as { appointment?: Record<string, number> };
    return sum + (counts.appointment?.Permanent ?? 0);
  }, 0);
  const staff = await prisma.staffSnapshot.findMany({ where: { status } });
  const ntpTotal = staff.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const enrollment = await prisma.enrollmentObservation.findMany({
    where: { status },
    include: { period: true },
  });
  const licensureTotals = await prisma.licensureObservation.findMany({
    where: { status, isTotalRow: true },
  });
  const performanceRows = await prisma.performanceObservation.findMany({
    where: { status },
    include: { indicator: true },
  });
  const awards = await prisma.studentAward.findMany({ where: { status } });
  const currentPeriod = await fiscalPeriod(EXECUTIVE_CURRENT_YEAR);

  await observe("ACADEMIC_PROGRAMS_TOTAL", {
    value: programs.length,
    periodId: currentPeriod.id,
    sourceNote: "Current published academic program snapshot",
  });
  await observe("PROGRAMS_WITH_COPC", {
    value: programs.filter((item) => item.copcNumber).length,
    periodId: currentPeriod.id,
    sourceNote: "Programs with a COPC or equivalent authority reference",
  });
  await observe("ACCREDITABLE_PROGRAMS", {
    value: programs.filter((item) => item.accreditable).length,
    periodId: currentPeriod.id,
    sourceNote: "Programs marked accreditable",
  });
  await observe("ACCREDITED_PROGRAMS", {
    value: programs.filter((item) => item.accredited).length,
    periodId: currentPeriod.id,
    sourceNote: "Current published accreditation snapshot",
  });
  await observe("FACULTY_TOTAL", {
    value: facultyTotal,
    periodId: currentPeriod.id,
    sourceNote: "Current published faculty snapshot",
  });
  await observe("FACULTY_PERMANENT", {
    value: permanent,
    periodId: currentPeriod.id,
    sourceNote: "Sum of permanent appointment counts",
  });
  await observe("NTP_TOTAL", {
    value: ntpTotal,
    periodId: currentPeriod.id,
    sourceNote: "Current published non-teaching personnel snapshot",
  });

  for (const year of EXECUTIVE_KPI_YEARS) {
    const period = await fiscalPeriod(year);
    await observe("CAMPUSES_TOTAL", {
      value: 7,
      periodId: period.id,
      sourceNote: "Seven Partido State University campuses",
    });
    await observe("COLLEGES_TOTAL", {
      value: 11,
      periodId: period.id,
      sourceNote: "Eleven Partido State University colleges",
    });
    const inYear = enrollment.filter((row) => row.period && enrollmentPeriodFiscalYear(row.period) === year);
    const latestInYear = [...inYear]
      .filter((row) => row.period)
      .sort((a, b) => {
        const ay = (b.period?.academicYearStart ?? 0) - (a.period?.academicYearStart ?? 0);
        if (ay !== 0) return ay;
        return (b.period?.semester ?? 0) - (a.period?.semester ?? 0);
      })[0]?.period;
    if (latestInYear) {
      const current = inYear
        .filter((row) => row.periodId === latestInYear.id)
        .reduce((sum, row) => sum + (row.headcount ?? 0), 0);
      await observe("ENROLLMENT_CURRENT", {
        value: current,
        periodId: period.id,
        sourceNote: latestInYear.label,
      });
    }

    const licensure = licensureTotals.find((row) => row.fiscalYear === year);
    if (licensure) {
      const fromPerformanceSummary = (LICENSURE_SUMMARY_TOTAL_YEARS as readonly number[]).includes(year);
      await observe("LICENSURE_PASSING_RATE", {
        value: licensure.passingRate,
        numerator: licensure.firstTimePassers,
        denominator: licensure.firstTimeTakers,
        periodId: period.id,
        sourceNote: fromPerformanceSummary
          ? `FY ${year} first-time takers (university performance summary)`
          : year === EXECUTIVE_CURRENT_YEAR
            ? `FY ${year} first-time takers, year-to-date as of June 30, 2026`
            : `FY ${year} first-time takers (detailed worksheet total)`,
      });
    }

    const employability = performanceRows.find(
      (row) => row.fiscalYear === year && /graduates.*employed/i.test(row.indicator.title),
    );
    if (employability) {
      await observe("EMPLOYABILITY_RATE", {
        value: employability.accomplishmentValue,
        numerator: employability.numerator,
        denominator: employability.denominator,
        periodId: period.id,
        sourceNote:
          year === EXECUTIVE_CURRENT_YEAR
            ? `University performance employability indicator, FY ${year} (partial, as of June 30, 2026)`
            : `University performance employability indicator, FY ${year}`,
      });
    }

    const extensionPrograms = performanceRows.find(
      (row) => row.fiscalYear === year && /extension programs organized and supported/i.test(row.indicator.title),
    );
    if (extensionPrograms) {
      await observe("EXTENSION_PROGRAMS", {
        value: extensionPrograms.accomplishmentValue,
        periodId: period.id,
        sourceNote:
          year === EXECUTIVE_CURRENT_YEAR
            ? `University performance extension programs indicator, FY ${year} (as of June 30, 2026)`
            : `University performance extension programs indicator, FY ${year}`,
      });
    }

    await observe("STUDENT_AWARDS", {
      value: awards.filter((row) => awardFiscalYear(row) === year).length,
      periodId: period.id,
      sourceNote: `Awards dated in FY ${year}`,
    });

    if (year !== EXECUTIVE_CURRENT_YEAR) {
      const yearPerformance = performanceRows.filter((row) => row.fiscalYear === year);
      const meeting = yearPerformance.filter((row) =>
        meetingTarget({
          accomplishment: row.accomplishmentValue,
          target: row.targetValue,
          isPartial: row.isPartial,
        }),
      ).length;
      await observe("PERFORMANCE_MEETING_TARGET", {
        value: meeting,
        numerator: meeting,
        denominator: yearPerformance.filter(
          (row) =>
            classifyAchievement({
              accomplishment: row.accomplishmentValue,
              target: row.targetValue,
              isPartial: row.isPartial,
            }) !== "Pending",
        ).length,
        periodId: period.id,
        sourceNote: `FY ${year} complete-year indicators meeting or exceeding target`,
      });
    }

    await observe("RESEARCH_COMPLETED", {
      value: await prisma.researchCompletion.count({ where: { status, fiscalYear: year } }),
      periodId: period.id,
      sourceNote: year === EXECUTIVE_CURRENT_YEAR ? `FY ${year} (as of June 30, 2026)` : `FY ${year}`,
    });
    await observe("RESEARCH_PUBLICATIONS", {
      value: await prisma.researchPublication.count({ where: { status, fiscalYear: year } }),
      periodId: period.id,
      sourceNote: year === EXECUTIVE_CURRENT_YEAR ? `FY ${year} (as of June 30, 2026)` : `FY ${year}`,
    });
    await observe("RESEARCH_UTILIZED", {
      value: await prisma.researchUtilization.count({ where: { status, fiscalYear: year } }),
      periodId: period.id,
      sourceNote: `FY ${year}`,
    });
  }
}

export async function ensureCmsDefaults() {
  const pages = [
    { slug: "history", title: HISTORY_TITLE, body: HISTORY_BODY, published: true },
    { slug: "vision-mission-core-values", title: VMGO_TITLE, body: VMGO_BODY, published: true },
    { slug: "vmgo", title: VMGO_TITLE, body: VMGO_BODY, published: true },
  ];
  for (const page of pages) {
    const existing = await prisma.institutionalPage.findUnique({ where: { slug: page.slug } });
    await prisma.institutionalPage.upsert({
      where: { slug: page.slug },
      update: existing?.body?.trim() ? { title: page.title, published: true } : page,
      create: page,
    });
  }
  await prisma.official.deleteMany();
  await prisma.official.createMany({
    data: officialsSeed.map((official, index) => ({
      name: official.name,
      position: official.position,
      office: official.section,
      email: official.email,
      section: official.section,
      photoPath: official.photoPath,
      displayOrder: index,
      published: true,
    })),
  });
  const settings = [
    ["university.name", "Partido State University"],
    ["university.location", "Camarines Sur, Philippines"],
    ["dashboard.disclaimer", "Figures reflect published institutional records. Missing values are shown as unavailable rather than estimated."],
    ["dashboard.contact", "Partido State University, Goa, Camarines Sur"],
  ];
  for (const [key, value] of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  for (const document of PUBLIC_DOCUMENTS) {
    const existing = await prisma.documentRecord.findFirst({ where: { title: document.title } });
    const data = {
      title: document.title,
      category: document.category,
      externalUrl: document.externalUrl,
      visibility: "PUBLIC",
      published: true,
      publishedAt: existing?.publishedAt ?? new Date(),
    };
    if (existing) {
      await prisma.documentRecord.update({ where: { id: existing.id }, data });
    } else {
      await prisma.documentRecord.create({ data });
    }
  }
}

export async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.adminUser.create({
    data: {
      email,
      name: "Dashboard Administrator",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
}
