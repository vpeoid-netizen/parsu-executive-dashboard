"use server";

import {
  blankToNull,
  MANUAL_DATASET_VERSION,
  realId,
  toBool,
  toDate,
  toFloat,
  toInt,
  type EditorRow,
  type SaveResult,
} from "@/lib/admin/editor";
import { applyDeletedIds, finishDatasetSave, forSavedRows, requireAdmin, requirePayload } from "@/lib/admin/save";
import { prisma } from "@/lib/db";
import { getOrCreatePeriod } from "@/lib/import/persist";
import { parseFraction, parseRatioOrPercent } from "@/lib/metrics";
import { formatPeriod } from "@/lib/periods";
import { editorTextToAuthorsJson } from "@/lib/research";
import { appointmentHeadcount } from "@/lib/staff-offices";

function payloadOrError(formData: FormData) {
  const parsed = requirePayload(formData);
  return parsed;
}

function isPayload(value: ReturnType<typeof requirePayload>): value is { rows: EditorRow[]; deletedIds: string[] } {
  return "rows" in value;
}

function facultyCounts(row: EditorRow) {
  const appointment = {
    Permanent: toInt(row.permanent) ?? 0,
    Temporary: toInt(row.temporary) ?? 0,
    COS: toInt(row.cos) ?? 0,
  };
  const rank = {
    Instructor: toInt(row.instructor) ?? 0,
    "Assistant Professor": toInt(row.assistantProfessor) ?? 0,
    "Associate Professor": toInt(row.associateProfessor) ?? 0,
    Professor: toInt(row.professor) ?? 0,
    "University Professor": toInt(row.universityProfessor) ?? 0,
  };
  const education = {
    "Bachelor's Degree": toInt(row.bachelors) ?? 0,
    "Master's Degree": toInt(row.masters) ?? 0,
    "Doctorate Degree": toInt(row.doctorate) ?? 0,
  };
  return { appointment, rank, education };
}

function staffCounts(row: EditorRow) {
  const appointment = {
    Permanent: toInt(row.permanent) ?? 0,
    Casual: toInt(row.casual) ?? 0,
    "Job Order": toInt(row.jobOrder) ?? 0,
  };
  const rank: Record<string, number> = {};
  const rankValues = {
    Aide: toInt(row.aide) ?? 0,
    Assistant: toInt(row.assistant) ?? 0,
    Officer: toInt(row.officer) ?? 0,
    Supervising: toInt(row.supervising) ?? 0,
    Chief: toInt(row.chief) ?? 0,
  };
  for (const [key, value] of Object.entries(rankValues)) {
    if (value > 0) rank[key] = value;
  }
  return { appointment, ...(Object.keys(rank).length ? { rank } : {}) };
}

export async function saveFacultyAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.facultySnapshot.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(
    payload.rows,
    (row) => {
      const counts = facultyCounts(row);
      const total = counts.appointment.Permanent + counts.appointment.Temporary + counts.appointment.COS;
      return !blankToNull(row.collegeId) && !blankToNull(row.campusId) && total === 0;
    },
    async (row, id) => {
      const counts = facultyCounts(row);
      const total = counts.appointment.Permanent + counts.appointment.Temporary + counts.appointment.COS;
      const data = {
        campusId: blankToNull(row.campusId),
        collegeId: blankToNull(row.collegeId),
        total,
        countsJson: JSON.stringify(counts),
        status: "PUBLISHED" as const,
        datasetVersionId: MANUAL_DATASET_VERSION,
      };
      if (id) await prisma.facultySnapshot.update({ where: { id }, data });
      else await prisma.facultySnapshot.create({ data });
    },
  );
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "FacultySnapshot",
    summary: "Updated faculty counts by college",
    paths: ["/admin/faculty", "/personnel/faculty"],
    rebuildKpis: true,
  });
}

export async function saveStaffAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.staffSnapshot.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(
    payload.rows,
    (row) => !blankToNull(row.office) && !blankToNull(row.unit) && !blankToNull(row.department),
    async (row, id) => {
      const counts = staffCounts(row);
      const data = {
        campusId: blankToNull(row.campusId),
        department: blankToNull(row.department),
        office: blankToNull(row.office),
        unit: blankToNull(row.unit),
        total: appointmentHeadcount(counts),
        countsJson: JSON.stringify(counts),
        status: "PUBLISHED" as const,
        datasetVersionId: MANUAL_DATASET_VERSION,
      };
      if (id) await prisma.staffSnapshot.update({ where: { id }, data });
      else await prisma.staffSnapshot.create({ data });
    },
  );
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "StaffSnapshot",
    summary: "Updated non-teaching personnel by office",
    paths: ["/admin/staff", "/personnel/non-teaching"],
    rebuildKpis: true,
  });
}

export async function saveProgramsAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.academicProgram.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.name), async (row, id) => {
    const data = {
      campusId: blankToNull(row.campusId),
      collegeId: blankToNull(row.collegeId),
      name: String(blankToNull(row.name)),
      programType: blankToNull(row.programType),
      specializedMajor: blankToNull(row.specializedMajor),
      copcNumber: blankToNull(row.copcNumber),
      copcRaw: blankToNull(row.copcNumber),
      accreditationLevel: blankToNull(row.accreditationLevel),
      accreditationRaw: blankToNull(row.accreditationLevel),
      programStatus: blankToNull(row.programStatus),
      accreditable: row.accreditable === "" || row.accreditable === null ? null : toBool(row.accreditable),
      accredited: row.accredited === "" || row.accredited === null ? null : toBool(row.accredited),
      phaseOut: toBool(row.phaseOut),
      remarks: blankToNull(row.remarks),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.academicProgram.update({ where: { id }, data });
    else await prisma.academicProgram.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "AcademicProgram",
    summary: "Updated academic programs",
    paths: ["/admin/programs", "/academics/programs"],
    rebuildKpis: true,
  });
}

export async function saveEnrollmentAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.enrollmentObservation.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(
    payload.rows,
    (row) => !blankToNull(row.programName) || !toInt(row.academicYearStart) || !toInt(row.semester),
    async (row, id) => {
      const academicYearStart = toInt(row.academicYearStart) ?? new Date().getFullYear();
      const academicYearEnd = toInt(row.academicYearEnd) ?? academicYearStart + 1;
      const semester = toInt(row.semester) ?? 1;
      const period = await getOrCreatePeriod({
        type: "SEMESTER",
        label: formatPeriod({ type: "SEMESTER", academicYearStart, academicYearEnd, semester }),
        academicYearStart,
        academicYearEnd,
        semester,
      });
      const data = {
        campusId: blankToNull(row.campusId),
        collegeId: blankToNull(row.collegeId),
        programName: String(blankToNull(row.programName)),
        periodId: period.id,
        headcount: toInt(row.headcount),
        status: "PUBLISHED" as const,
        datasetVersionId: MANUAL_DATASET_VERSION,
      };
      if (id) await prisma.enrollmentObservation.update({ where: { id }, data });
      else await prisma.enrollmentObservation.create({ data });
    },
  );
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "EnrollmentObservation",
    summary: "Updated student enrollment",
    paths: ["/admin/students", "/students/enrollment"],
    rebuildKpis: true,
  });
}

export async function saveLicensureAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.licensureObservation.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.programName), async (row, id) => {
    const takers = toInt(row.firstTimeTakers);
    const passers = toInt(row.firstTimePassers);
    const passingRate =
      toFloat(row.passingRate) ?? (takers && passers != null && takers > 0 ? passers / takers : null);
    const data = {
      campusId: blankToNull(row.campusId),
      programName: String(blankToNull(row.programName)),
      examMonth: blankToNull(row.examMonth),
      fiscalYear: toInt(row.fiscalYear) ?? new Date().getFullYear(),
      firstTimeTakers: takers,
      firstTimePassers: passers,
      passingRate,
      isTotalRow: toBool(row.isTotalRow),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.licensureObservation.update({ where: { id }, data });
    else await prisma.licensureObservation.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "LicensureObservation",
    summary: "Updated licensure examination records",
    paths: ["/admin/students", "/students/licensure"],
    rebuildKpis: true,
  });
}

export async function saveAwardsAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.studentAward.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.recipient), async (row, id) => {
    const data = {
      recipient: String(blankToNull(row.recipient)),
      programName: blankToNull(row.programName),
      eventName: blankToNull(row.eventName),
      awardRank: blankToNull(row.awardRank),
      occurredRaw: blankToNull(row.occurredRaw),
      occurredOn: toDate(row.occurredOn),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.studentAward.update({ where: { id }, data });
    else await prisma.studentAward.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "StudentAward",
    summary: "Updated student awards",
    paths: ["/admin/students", "/students/awards"],
    rebuildKpis: true,
  });
}

export async function saveEmployabilityAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.employabilityObservation.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.collegeName) && !blankToNull(row.collegeId), async (row, id) => {
    const graduates = toInt(row.graduates);
    const employed = toInt(row.employed);
    const rate = toFloat(row.rate) ?? (graduates && employed != null && graduates > 0 ? employed / graduates : null);
    const college = blankToNull(row.collegeId)
      ? await prisma.college.findUnique({ where: { id: String(row.collegeId) } })
      : null;
    const data = {
      cohortLabel: blankToNull(row.cohortLabel) ?? "Latest cohort",
      collegeId: blankToNull(row.collegeId),
      collegeName: college?.name ?? blankToNull(row.collegeName) ?? "Unspecified",
      graduates,
      employed,
      rate,
      rawValue: blankToNull(row.rawValue),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.employabilityObservation.update({ where: { id }, data });
    else await prisma.employabilityObservation.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "EmployabilityObservation",
    summary: "Updated graduate employability",
    paths: ["/admin/students", "/students"],
    rebuildKpis: true,
  });
}

export async function savePerformanceAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.performanceObservation.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.title), async (row, id) => {
    const programMfo = blankToNull(row.programMfo) ?? "Unspecified";
    const title = String(blankToNull(row.title));
    const indicatorType = blankToNull(row.indicatorType) ?? "Indicator";
    const fiscalYear = toInt(row.fiscalYear) ?? new Date().getFullYear();
    const targetRaw = blankToNull(row.targetRaw);
    const accomplishmentRaw = blankToNull(row.accomplishmentRaw);
    const fraction = parseFraction(accomplishmentRaw);
    const existing = id ? await prisma.performanceObservation.findUnique({ where: { id } }) : null;
    const indicator =
      existing
        ? await prisma.performanceIndicator.update({
            where: { id: existing.indicatorId },
            data: { programMfo, indicatorType, title },
          })
        : await prisma.performanceIndicator.upsert({
            where: { code: `${programMfo}:${title}`.slice(0, 180) },
            update: { programMfo, indicatorType, title },
            create: { code: `${programMfo}:${title}`.slice(0, 180), programMfo, indicatorType, title },
          });
    const isPartial = toBool(row.isPartial);
    const data = {
      indicatorId: indicator.id,
      fiscalYear,
      targetRaw,
      targetValue: parseRatioOrPercent(targetRaw),
      accomplishmentRaw,
      accomplishmentValue: parseRatioOrPercent(accomplishmentRaw),
      numerator: fraction.numerator,
      denominator: fraction.denominator,
      isPartial,
      remarks: blankToNull(row.remarks),
      asOfDate: isPartial && fiscalYear === 2026 ? new Date("2026-06-30T00:00:00") : null,
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.performanceObservation.update({ where: { id }, data });
    else await prisma.performanceObservation.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "PerformanceObservation",
    summary: "Updated university performance indicators",
    paths: ["/admin/performance", "/performance"],
    rebuildKpis: true,
  });
}

export async function saveResearchCompletedAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.researchCompletion.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.title), async (row, id) => {
    const data = {
      fiscalYear: toInt(row.fiscalYear) ?? new Date().getFullYear(),
      quarter: toInt(row.quarter),
      title: String(blankToNull(row.title)),
      authorsJson: editorTextToAuthorsJson(blankToNull(row.authors)),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.researchCompletion.update({ where: { id }, data });
    else await prisma.researchCompletion.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "ResearchCompletion",
    summary: "Updated completed research",
    paths: ["/admin/research", "/research/completed"],
    rebuildKpis: true,
  });
}

export async function saveResearchPublicationsAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.researchPublication.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.publishedTitle), async (row, id) => {
    const data = {
      fiscalYear: toInt(row.fiscalYear) ?? new Date().getFullYear(),
      publishedTitle: String(blankToNull(row.publishedTitle)),
      originalTitle: blankToNull(row.originalTitle),
      authorsJson: editorTextToAuthorsJson(blankToNull(row.authors)),
      journal: blankToNull(row.journal),
      indexing: blankToNull(row.indexing),
      doi: blankToNull(row.doi),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.researchPublication.update({ where: { id }, data });
    else await prisma.researchPublication.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "ResearchPublication",
    summary: "Updated research publications",
    paths: ["/admin/research", "/research/publications"],
    rebuildKpis: true,
  });
}

export async function saveResearchUtilizationAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.researchUtilization.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(
    payload.rows,
    (row) => !blankToNull(row.productName) && !blankToNull(row.researchTitle),
    async (row, id) => {
      const data = {
        fiscalYear: toInt(row.fiscalYear) ?? new Date().getFullYear(),
        collegeCode: blankToNull(row.collegeCode),
        productName: blankToNull(row.productName),
        researchTitle: blankToNull(row.researchTitle),
        beneficiary: blankToNull(row.beneficiary),
        patentOrDescription: blankToNull(row.patentOrDescription),
        authorsJson: editorTextToAuthorsJson(blankToNull(row.authors)),
        status: "PUBLISHED" as const,
        datasetVersionId: MANUAL_DATASET_VERSION,
      };
      if (id) await prisma.researchUtilization.update({ where: { id }, data });
      else await prisma.researchUtilization.create({ data });
    },
  );
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "ResearchUtilization",
    summary: "Updated research utilization",
    paths: ["/admin/research", "/research/utilization"],
    rebuildKpis: true,
  });
}

export async function saveResearchGrantsAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.researchGrant.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.title), async (row, id) => {
    const data = {
      title: String(blankToNull(row.title)),
      principalInvestigator: blankToNull(row.principalInvestigator),
      fundingAgency: blankToNull(row.fundingAgency),
      amount: toFloat(row.amount),
      duration: blankToNull(row.duration),
      grantStatus: blankToNull(row.grantStatus),
      fundingType: blankToNull(row.fundingType),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.researchGrant.update({ where: { id }, data });
    else await prisma.researchGrant.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "ResearchGrant",
    summary: "Updated research grants",
    paths: ["/admin/research", "/research/grants"],
    rebuildKpis: true,
  });
}

export async function saveExtensionAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.extensionProgram.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.title), async (row, id) => {
    const data = {
      title: String(blankToNull(row.title)),
      borReference: blankToNull(row.borReference),
      approvedAt: toDate(row.approvedAt),
      office: blankToNull(row.office),
      projectLeader: blankToNull(row.projectLeader),
      programStatus: blankToNull(row.programStatus),
      beneficiaries: blankToNull(row.beneficiaries),
      location: blankToNull(row.location),
      status: "PUBLISHED" as const,
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.extensionProgram.update({ where: { id }, data });
    else await prisma.extensionProgram.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "ExtensionProgram",
    summary: "Updated extension programs",
    paths: ["/admin/extension", "/extension"],
    rebuildKpis: true,
  });
}

export async function saveOfficialsTableAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  for (const id of payload.deletedIds) {
    const recordId = realId(id);
    if (recordId) await prisma.official.deleteMany({ where: { id: recordId } });
  }
  await forSavedRows(payload.rows, (row) => !blankToNull(row.name) || !blankToNull(row.position), async (row, id) => {
    const data = {
      name: String(blankToNull(row.name)),
      position: String(blankToNull(row.position)),
      office: blankToNull(row.office),
      section: blankToNull(row.section),
      email: blankToNull(row.email),
      displayOrder: toInt(row.displayOrder) ?? 0,
      published: toBool(row.published),
    };
    if (id) await prisma.official.update({ where: { id }, data });
    else await prisma.official.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "Official",
    summary: "Updated university officials",
    paths: ["/admin/officials", "/about/officials"],
  });
}

export async function saveDocumentsTableAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  for (const id of payload.deletedIds) {
    const recordId = realId(id);
    if (recordId) await prisma.documentRecord.deleteMany({ where: { id: recordId } });
  }
  await forSavedRows(payload.rows, (row) => !blankToNull(row.title), async (row, id) => {
    const published = toBool(row.published);
    const data = {
      title: String(blankToNull(row.title)),
      category: blankToNull(row.category) ?? "Other",
      description: blankToNull(row.description),
      externalUrl: blankToNull(row.externalUrl),
      version: blankToNull(row.version),
      visibility: "PUBLIC",
      published,
      publishedAt: published ? new Date() : null,
    };
    if (id) await prisma.documentRecord.update({ where: { id }, data });
    else await prisma.documentRecord.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "DocumentRecord",
    summary: "Updated documents",
    paths: ["/admin/documents", "/documents"],
  });
}

export async function saveFlagshipsTableAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  for (const id of payload.deletedIds) {
    const recordId = realId(id);
    if (recordId) await prisma.flagshipProgram.deleteMany({ where: { id: recordId } });
  }
  await forSavedRows(payload.rows, (row) => !blankToNull(row.title), async (row, id) => {
    const data = {
      title: String(blankToNull(row.title)),
      shortDescription: blankToNull(row.shortDescription),
      fullDescription: blankToNull(row.fullDescription),
      office: blankToNull(row.office),
      programLead: blankToNull(row.programLead),
      programStatus: blankToNull(row.programStatus),
      showOnHomepage: toBool(row.showOnHomepage),
      published: toBool(row.published),
      displayOrder: toInt(row.displayOrder) ?? 0,
    };
    if (id) await prisma.flagshipProgram.update({ where: { id }, data });
    else await prisma.flagshipProgram.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "FlagshipProgram",
    summary: "Updated flagship programs",
    paths: ["/admin/content", "/flagship"],
  });
}

export async function saveBudgetTableAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.budgetRecord.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !toInt(row.fiscalYear) && !blankToNull(row.programPap), async (row, id) => {
    const data = {
      fiscalYear: toInt(row.fiscalYear) ?? new Date().getFullYear(),
      fundingSource: blankToNull(row.fundingSource),
      programPap: blankToNull(row.programPap),
      category: blankToNull(row.category),
      budget: toFloat(row.budget),
      obligation: toFloat(row.obligation),
      disbursement: toFloat(row.disbursement),
      publiclyPublishable: toBool(row.publiclyPublishable),
      status: toBool(row.published) ? ("PUBLISHED" as const) : ("DRAFT" as const),
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.budgetRecord.update({ where: { id }, data });
    else await prisma.budgetRecord.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "BudgetRecord",
    summary: "Updated budget records",
    paths: ["/admin/budget", "/budget"],
  });
}

export async function saveInfrastructureTableAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.infrastructureProject.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.name), async (row, id) => {
    const data = {
      classification: blankToNull(row.classification) ?? "ONGOING",
      name: String(blankToNull(row.name)),
      contractor: blankToNull(row.contractor),
      projectStatus: blankToNull(row.projectStatus),
      delayNotes: blankToNull(row.delayNotes),
      sourceOfFund: blankToNull(row.sourceOfFund),
      physicalAccomplishment: toFloat(row.physicalAccomplishment),
      financialAccomplishment: toFloat(row.financialAccomplishment),
      status: toBool(row.published) ? ("PUBLISHED" as const) : ("DRAFT" as const),
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.infrastructureProject.update({ where: { id }, data });
    else await prisma.infrastructureProject.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "InfrastructureProject",
    summary: "Updated infrastructure projects",
    paths: ["/admin/infrastructure", "/infrastructure"],
  });
}

export async function savePartnersTableAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  await applyDeletedIds(payload.deletedIds, (id) =>
    prisma.internationalPartner.updateMany({ where: { id }, data: { status: "ARCHIVED" } }),
  );
  await forSavedRows(payload.rows, (row) => !blankToNull(row.institution), async (row, id) => {
    const data = {
      institution: String(blankToNull(row.institution)),
      country: blankToNull(row.country),
      agreementType: blankToNull(row.agreementType),
      partnerStatus: blankToNull(row.partnerStatus),
      activities: blankToNull(row.activities),
      responsibleOffice: blankToNull(row.responsibleOffice),
      status: toBool(row.published) ? ("PUBLISHED" as const) : ("DRAFT" as const),
      datasetVersionId: MANUAL_DATASET_VERSION,
    };
    if (id) await prisma.internationalPartner.update({ where: { id }, data });
    else await prisma.internationalPartner.create({ data });
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "InternationalPartner",
    summary: "Updated international partners",
    paths: ["/admin/internationalization", "/internationalization"],
  });
}

export async function saveAssetsTableAction(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin();
  const payload = payloadOrError(formData);
  if (!isPayload(payload)) return payload;
  for (const id of payload.deletedIds) {
    const recordId = realId(id);
    if (!recordId) continue;
    const [kind, real] = recordId.includes(":") ? recordId.split(":") : ["building", recordId];
    if (kind === "land") await prisma.landAsset.updateMany({ where: { id: real }, data: { status: "ARCHIVED" } });
    else if (kind === "vehicle") await prisma.vehicleAsset.updateMany({ where: { id: real }, data: { status: "ARCHIVED" } });
    else await prisma.buildingAsset.updateMany({ where: { id: real }, data: { status: "ARCHIVED" } });
  }
  await forSavedRows(payload.rows, (row) => !blankToNull(row.name), async (row, id) => {
    const kind = blankToNull(row.kind) ?? "building";
    const published = toBool(row.published) ? ("PUBLISHED" as const) : ("DRAFT" as const);
    const recordId = id?.includes(":") ? id.split(":")[1] : id;
    if (kind === "land") {
      const data = {
        location: String(blankToNull(row.name)),
        landArea: blankToNull(row.detail),
        remarks: blankToNull(row.statusNote),
        status: published,
        datasetVersionId: MANUAL_DATASET_VERSION,
      };
      if (recordId) await prisma.landAsset.update({ where: { id: recordId }, data });
      else await prisma.landAsset.create({ data });
    } else if (kind === "vehicle") {
      const data = {
        name: String(blankToNull(row.name)),
        plateOrPropertyNo: blankToNull(row.detail),
        operationalStatus: blankToNull(row.statusNote),
        status: published,
        datasetVersionId: MANUAL_DATASET_VERSION,
      };
      if (recordId) await prisma.vehicleAsset.update({ where: { id: recordId }, data });
      else await prisma.vehicleAsset.create({ data });
    } else {
      const data = {
        name: String(blankToNull(row.name)),
        buildingType: blankToNull(row.detail),
        buildingStatus: blankToNull(row.statusNote),
        status: published,
        datasetVersionId: MANUAL_DATASET_VERSION,
      };
      if (recordId) await prisma.buildingAsset.update({ where: { id: recordId }, data });
      else await prisma.buildingAsset.create({ data });
    }
  });
  return finishDatasetSave({
    adminId: admin.id,
    entityType: "Asset",
    summary: "Updated physical assets",
    paths: ["/admin/assets", "/assets"],
  });
}
