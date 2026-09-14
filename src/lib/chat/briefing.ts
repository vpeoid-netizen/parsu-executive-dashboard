import { unstable_cache } from "next/cache";
import { ADMINISTRATIVE_ORDERS, administrativeOrderLabel } from "@/lib/administrative-orders";
import { CAMPUSES_DIRECTORY } from "@/lib/about/campuses";
import { COLLEGES_DIRECTORY } from "@/lib/about/colleges";
import { CORE_VALUES, HISTORY_TITLE, OFFICIALS_AS_OF, VMGO_SECTIONS } from "@/lib/about/content";
import { UNIVERSITY_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber, formatPercent, formatPeso } from "@/lib/format";
import { getHomepageData } from "@/lib/homepage-data";
import { collegeAbbrev, collegeFullName } from "@/lib/import/normalize";
import { classifyAchievement } from "@/lib/metrics";
import { publicNavigation } from "@/lib/navigation";
import {
  PERFORMANCE_FOCUS_YEAR,
  displayMeasure,
  indicatorAnchorId,
  isPercentMeasure,
  yearLabel,
} from "@/lib/performance-display";
import { formatProgramAuthority, hasCopcNumber } from "@/lib/program-coverage";
import { type ChatFact, FY_2026_PARTIAL_NOTE, factsToBriefingText } from "@/lib/chat/facts";
import { staffFactsFromGrouped } from "@/lib/chat/staff-facts";
import { sumFacultyCounts, sumStaffCounts } from "@/lib/personnel-counts";
import {
  alignStaffTotalsToAppointments,
  groupStaffOffices,
  type StaffOfficeRow,
} from "@/lib/staff-offices";

function formatKpiValue(format: string, value: number | null) {
  return format === "percent" ? formatPercent(value) : formatNumber(value, 0);
}

function mixLine(counts: Record<string, number>) {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => `${name} ${formatNumber(value, 0)}`)
    .join("; ");
}

function addFact(facts: ChatFact[], fact: ChatFact) {
  facts.push({
    ...fact,
    body: fact.body.replace(/\s+/g, " ").trim(),
  });
}

function buildStaticFacts() {
  const facts: ChatFact[] = [];
  addFact(facts, {
    id: "about",
    title: "About this dashboard",
    body: `This is the ${UNIVERSITY_NAME} Executive Dashboard. It publishes institutional counts and performance figures for executives and the public. Contact: Office of the Vice President for Executive Operations, vpeoid@parsu.edu.ph, Goa, Camarines Sur. ${FY_2026_PARTIAL_NOTE}`,
    href: "/",
    keywords: "parsu partido state university dashboard about contact vpeoid",
  });

  for (const section of VMGO_SECTIONS) {
    addFact(facts, {
      id: `vmgo-${section.heading.toLowerCase()}`,
      title: section.heading,
      body: section.body,
      href: "/about/vision-mission-core-values",
      keywords: "vision mission vmgo",
    });
  }
  addFact(facts, {
    id: "core-values",
    title: "Core values",
    body: CORE_VALUES.map((value) => `${value.letter} — ${value.title}: ${value.body}`).join(" "),
    href: "/about/vision-mission-core-values",
    keywords: "core values passion service unity inclusiveness",
  });

  addFact(facts, {
    id: "history",
    title: HISTORY_TITLE,
    body: "Partido High School opened in Goa in June 1941. It became Partido National High School, then Partido State College. Republic Act No. 9029, authored by Speaker Arnulfo P. Fuentebella and signed by President Gloria Macapagal-Arroyo on March 5, 2001, created Partido State University.",
    href: "/about/history",
    keywords: "history ra 9029 origin partido high school state college",
  });

  addFact(facts, {
    id: "campuses",
    title: "Campuses",
    body: `ParSU has 7 campuses: ${CAMPUSES_DIRECTORY.map((campus) => `${campus.name} (${campus.town})`).join("; ")}.`,
    href: "/about/campuses",
    keywords: "campus campuses goa caramoan lagonoy sagñay sagnay salogon san jose tinambac satellite",
  });
  for (const campus of CAMPUSES_DIRECTORY) {
    addFact(facts, {
      id: `campus-${campus.slug}`,
      title: campus.name,
      body: `${campus.body} Address: ${campus.address}. Colleges: ${campus.colleges.join("; ")}.`,
      href: "/about/campuses",
      keywords: `${campus.name} ${campus.town} ${campus.colleges.join(" ")}`,
    });
  }

  addFact(facts, {
    id: "colleges",
    title: "Colleges",
    body: `ParSU has 11 colleges across 7 campuses: ${COLLEGES_DIRECTORY.map((college) => `${college.code} ${college.name} (${college.campus})`).join("; ")}.`,
    href: "/about/colleges",
    keywords: "colleges cah cbm ced cec cos car lag sag sal san tin cpsch",
  });

  addFact(facts, {
    id: "administrative-orders",
    title: "Administrative orders",
    body: `Administrative Orders are listed by year on /documents/administrative-orders. ${ADMINISTRATIVE_ORDERS.map((order) => `${administrativeOrderLabel(order)}: ${order.title}`).join("; ")}`,
    href: "/documents/administrative-orders",
    keywords: "administrative order ao memo guidelines",
  });

  const nav = publicNavigation
    .flatMap((item) => [item, ...(item.children ?? [])])
    .map((item) => `${item.label} ${item.href}`)
    .join("; ");
  addFact(facts, {
    id: "navigation",
    title: "Dashboard pages",
    body: `Public pages: ${nav}.`,
    href: "/",
    keywords: "pages menu navigation where to find",
  });
  return facts;
}

async function loadPublishedFacts() {
  const [home, programs, officials, staffRows, campuses, facultyRows, colleges] = await Promise.all([
    getHomepageData(),
    prisma.academicProgram.findMany({
      where: { status: "PUBLISHED" },
      select: {
        name: true,
        programType: true,
        copcNumber: true,
        accreditationLevel: true,
        accreditable: true,
        accredited: true,
        college: { select: { code: true } },
        campus: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.official.findMany({
      where: { published: true },
      orderBy: { displayOrder: "asc" },
      select: { name: true, position: true, office: true, section: true },
    }),
    prisma.staffSnapshot.findMany({
      where: { status: "PUBLISHED" },
      select: {
        department: true,
        office: true,
        unit: true,
        campusId: true,
        total: true,
        countsJson: true,
      },
    }),
    prisma.campus.findMany({ select: { id: true, name: true } }),
    prisma.facultySnapshot.findMany({
      where: { status: "PUBLISHED" },
      select: { collegeId: true, total: true, countsJson: true },
    }),
    prisma.college.findMany({ select: { id: true, code: true } }),
  ]);
  const [
    licensureRows,
    awardRows,
    employabilityRows,
    researchTitles,
    publicationTitles,
    utilizationRows,
    grantRows,
    extensionTitles,
    budgetRows,
    landAssets,
    buildingAssets,
    laboratoryAssets,
    accommodationAssets,
    vehicleAssets,
    infrastructureRows,
    internationalPartners,
    internationalMemberships,
    flagships,
    allDocuments,
  ] = await Promise.all([
    prisma.licensureObservation.findMany({
      where: { status: "PUBLISHED" },
      select: {
        programName: true,
        examination: true,
        fiscalYear: true,
        passingRate: true,
        firstTimeTakers: true,
        firstTimePassers: true,
        isTotalRow: true,
        campusId: true,
      },
      orderBy: [{ fiscalYear: "desc" }, { programName: "asc" }],
    }),
    prisma.studentAward.findMany({
      where: { status: "PUBLISHED" },
      select: { recipient: true, awardRank: true, eventName: true, level: true, programName: true },
      orderBy: { recipient: "asc" },
      take: 40,
    }),
    prisma.employabilityObservation.findMany({
      where: { status: "PUBLISHED" },
      select: { collegeName: true, cohortLabel: true, graduates: true, employed: true, rate: true, reportingYear: true },
    }),
    prisma.researchCompletion.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, fiscalYear: true },
      orderBy: [{ fiscalYear: "desc" }, { title: "asc" }],
      take: 40,
    }),
    prisma.researchPublication.findMany({
      where: { status: "PUBLISHED" },
      select: { publishedTitle: true, fiscalYear: true, journal: true },
      orderBy: [{ fiscalYear: "desc" }, { publishedTitle: "asc" }],
      take: 40,
    }),
    prisma.researchUtilization.findMany({
      where: { status: "PUBLISHED" },
      select: { researchTitle: true, productName: true, fiscalYear: true, beneficiary: true },
      orderBy: [{ fiscalYear: "desc" }, { researchTitle: "asc" }],
    }),
    prisma.researchGrant.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, fundingAgency: true, amount: true, grantStatus: true },
    }),
    prisma.extensionProgram.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, programStatus: true, projectLeader: true, location: true },
    }),
    prisma.budgetRecord.findMany({
      where: { status: "PUBLISHED", publiclyPublishable: true },
      select: { fiscalYear: true, category: true, fundingSource: true, budget: true, allotment: true, obligation: true, disbursement: true },
    }),
    prisma.landAsset.findMany({ where: { status: "PUBLISHED" }, select: { location: true, landArea: true } }),
    prisma.buildingAsset.findMany({
      where: { status: "PUBLISHED" },
      select: { name: true, buildingType: true, buildingStatus: true },
    }),
    prisma.laboratoryAsset.findMany({
      where: { status: "PUBLISHED" },
      select: { name: true, labType: true },
    }),
    prisma.accommodationAsset.findMany({
      where: { status: "PUBLISHED" },
      select: { name: true, kind: true, capacity: true },
    }),
    prisma.vehicleAsset.findMany({
      where: { status: "PUBLISHED" },
      select: { name: true, vehicleType: true, operationalStatus: true },
    }),
    prisma.infrastructureProject.findMany({
      where: { status: "PUBLISHED" },
      select: { name: true, classification: true, projectStatus: true, projectCost: true, campusId: true },
    }),
    prisma.internationalPartner.findMany({
      where: { status: "PUBLISHED" },
      select: { institution: true, country: true, agreementType: true, partnerStatus: true },
    }),
    prisma.internationalMembership.findMany({
      where: { status: "PUBLISHED" },
      select: { organization: true, membershipType: true, membershipStatus: true },
    }),
    prisma.flagshipProgram.findMany({
      where: { published: true },
      orderBy: { displayOrder: "asc" },
      select: { title: true, shortDescription: true, office: true, programStatus: true },
    }),
    prisma.documentRecord.findMany({
      where: { published: true, visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      select: { title: true, category: true, effectiveYear: true },
      take: 30,
    }),
  ]);

  const facts: ChatFact[] = [];
  const facultyCounts = sumFacultyCounts(home.faculty);
  const staffCounts = sumStaffCounts(home.staff);
  const kpis = {
    ...home.kpis,
    current: home.kpis.current.map((kpi) =>
      kpi.code === "NTP_TOTAL" ? { ...kpi, value: staffCounts.total } : kpi,
    ),
  };

  for (const kpi of kpis.current) {
    const reference = kpis.reference
      .map((yearBlock) => {
        const match = yearBlock.kpis.find((item) => item.code === kpi.code);
        if (!match || match.value === null) return null;
        return `FY ${yearBlock.year} ${formatKpiValue(match.format, match.value)}`;
      })
      .filter(Boolean)
      .join("; ");
    addFact(facts, {
      id: `kpi-${kpi.code}`,
      title: kpi.shortTitle,
      body: `${kpi.groupName ? `${kpi.groupName}. ` : ""}FY ${kpis.currentYear} value: ${formatKpiValue(kpi.format, kpi.value)}.${kpi.periodLabel ? ` Period: ${kpi.periodLabel}.` : ""}${kpi.sourceNote ? ` Note: ${kpi.sourceNote}.` : ""}${reference ? ` Earlier years: ${reference}.` : ""}`,
      href: kpi.detailsHref ?? "/",
      keywords: `${kpi.code} ${kpi.shortTitle} ${kpi.groupName ?? ""} ${kpi.code === "PROGRAMS_WITH_COPC" ? "copc rrpa authority" : ""} ${kpi.code === "NTP_TOTAL" ? "non-teaching staff personnel ntp" : ""} ${kpi.code === "LICENSURE_PASSING_RATE" ? "board exam passing rate first-time takers" : ""} ${kpi.code === "EMPLOYABILITY_RATE" ? "employed graduates jobs 2 years prior" : ""}`,
    });
  }

  const latestEnrollment = home.enrollment.at(-1);
  if (latestEnrollment) {
    const byCollege = Object.entries(latestEnrollment.byCollege)
      .sort((a, b) => b[1] - a[1])
      .map(([code, headcount]) => `${collegeAbbrev(code)} ${formatNumber(headcount, 0)}`)
      .join("; ");
    addFact(facts, {
      id: "enrollment-latest",
      title: `Enrollment (${latestEnrollment.label})`,
      body: `Latest published enrollment is ${formatNumber(latestEnrollment.total, 0)} students for ${latestEnrollment.label}. By college: ${byCollege}.`,
      href: "/students/enrollment",
      keywords: "enrollment enrolled headcount students ay semester",
    });
  }

  const copcCount = programs.filter((program) => hasCopcNumber(program.copcNumber)).length;
  const accreditedCount = programs.filter((program) => program.accredited === true).length;
  addFact(facts, {
    id: "programs-summary",
    title: "Academic programs",
    body: `${formatNumber(programs.length, 0)} published academic programs. With COPC/RRPA: ${formatNumber(copcCount, 0)}. Accredited: ${formatNumber(accreditedCount, 0)}. Program authority uses COPC or RRPA labels; Bachelor of Public Administration uses RRPA No. 02.`,
    href: "/academics/programs",
    keywords: "programs copc rrpa accredited accreditable bpa",
  });
  for (const program of programs) {
    const authority = formatProgramAuthority(program.copcNumber);
    addFact(facts, {
      id: `program-${program.name}`,
      title: program.name,
      body: `${program.programType ?? "Program"} at ${collegeFullName(program.college?.code)} (${collegeAbbrev(program.college?.code)}), ${program.campus?.name ?? "campus not specified"}.${authority ? ` Authority: ${authority}.` : ""}${program.accreditationLevel ? ` Accreditation: ${program.accreditationLevel}.` : ""} Accreditable: ${program.accreditable ? "yes" : "no"}. Accredited: ${program.accredited ? "yes" : "no"}.`,
      href: "/academics/programs",
      keywords: `${program.name} ${collegeAbbrev(program.college?.code)} ${program.campus?.name ?? ""}`,
    });
  }

  addFact(facts, {
    id: "faculty",
    title: "Faculty members",
    body: `Published faculty headcount is ${formatNumber(facultyCounts.total, 0)}. Appointment mix: ${mixLine(facultyCounts.appointment) || "not specified"}. Rank mix: ${mixLine(facultyCounts.rank) || "not specified"}. Highest educational attainment: ${mixLine(facultyCounts.education) || "not specified"}.`,
    href: "/personnel/faculty",
    keywords: "faculty teachers professors instructors permanent temporary cos bachelor master doctorate education attainment",
  });
  addFact(facts, {
    id: "ntp",
    title: "Non-teaching personnel",
    body: `Published non-teaching personnel headcount is ${formatNumber(staffCounts.total, 0)}. Appointment mix: ${mixLine(staffCounts.appointment) || "not specified"}. Office and department counts are listed below and can be added together.`,
    href: "/personnel/non-teaching",
    keywords: "ntp staff non-teaching personnel casual job order permanent",
  });

  const campusName = Object.fromEntries(campuses.map((item) => [item.id, item.name]));
  const staffParsed: StaffOfficeRow[] = alignStaffTotalsToAppointments(
    staffRows.map((row) => ({
      department: row.department,
      office: row.office,
      unit: row.unit,
      campus: row.campusId ? campusName[row.campusId] ?? "Central / unspecified" : "Central / unspecified",
      total: row.total ?? 0,
      counts: JSON.parse(row.countsJson) as { appointment?: Record<string, number> },
    })),
  );
  for (const fact of staffFactsFromGrouped(groupStaffOffices(staffParsed))) {
    addFact(facts, fact);
  }

  const collegeById = Object.fromEntries(colleges.map((item) => [item.id, item]));
  const facultyByCollege = new Map<
    string,
    { total: number; appointment: Record<string, number>; rank: Record<string, number>; education: Record<string, number> }
  >();
  for (const row of facultyRows) {
    const code = row.collegeId ? collegeById[row.collegeId]?.code : undefined;
    const label = collegeAbbrev(code);
    const current = facultyByCollege.get(label) ?? { total: 0, appointment: {}, rank: {}, education: {} };
    current.total += row.total ?? 0;
    const counts = JSON.parse(row.countsJson) as {
      appointment?: Record<string, number>;
      rank?: Record<string, number>;
      education?: Record<string, number>;
    };
    for (const [key, value] of Object.entries(counts.appointment ?? {})) {
      current.appointment[key] = (current.appointment[key] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(counts.rank ?? {})) {
      current.rank[key] = (current.rank[key] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(counts.education ?? {})) {
      current.education[key] = (current.education[key] ?? 0) + value;
    }
    facultyByCollege.set(label, current);
  }
  if (facultyByCollege.size) {
    addFact(facts, {
      id: "faculty-by-college",
      title: "Faculty by college",
      body: `Published faculty by college: ${[...facultyByCollege.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, value]) => `${name} ${formatNumber(value.total, 0)}`)
        .join("; ")}.`,
      href: "/personnel/faculty",
      keywords: "faculty by college teachers professors instructors",
    });
    for (const [label, value] of facultyByCollege) {
      addFact(facts, {
        id: `faculty-college-${label}`,
        title: `Faculty at ${label}`,
        body: `${label} faculty: ${formatNumber(value.total, 0)}. Appointment: ${mixLine(value.appointment) || "not specified"}. Rank: ${mixLine(value.rank) || "not specified"}. Highest educational attainment: ${mixLine(value.education) || "not specified"}.`,
        href: "/personnel/faculty",
        keywords: `${label} faculty teachers professors instructors education`,
      });
    }
  }

  for (const indicator of home.performance) {
    const asPercent = isPercentMeasure(indicator.title, indicator.observations);
    const focus = indicator.observations.find((row) => row.fiscalYear === PERFORMANCE_FOCUS_YEAR);
    const history = indicator.observations
      .map((row) => {
        const status = classifyAchievement({
          accomplishment: row.accomplishmentValue,
          target: row.targetValue,
          isPartial: row.isPartial,
        });
        return `${yearLabel(row.fiscalYear, row.isPartial)} target ${displayMeasure(row.targetRaw, row.targetValue, asPercent)}, accomplishment ${displayMeasure(row.accomplishmentRaw, row.accomplishmentValue, asPercent)} (${status})`;
      })
      .join("; ");
    addFact(facts, {
      id: `perf-${indicator.id}`,
      title: indicator.title,
      body: `${indicator.programMfo}. ${history}.${focus?.isPartial ? ` ${FY_2026_PARTIAL_NOTE}` : ""}`,
      href: `/performance#${indicatorAnchorId(indicator.title)}`,
      keywords: `${indicator.programMfo} ${indicator.indicatorType ?? ""} performance target accomplishment mfo`,
    });
  }

  addFact(facts, {
    id: "research-fy2026",
    title: "Research (FY 2026)",
    body: `FY 2026 published records: completed research ${formatNumber(home.completions.length, 0)}; publications ${formatNumber(home.publications.length, 0)}; utilization ${formatNumber(home.utilizations.length, 0)}. ${FY_2026_PARTIAL_NOTE}`,
    href: "/research",
    keywords: "research completed publications utilization grants",
  });

  const extensionStatus = Object.entries(
    home.extensionPrograms.reduce<Record<string, number>>((acc, program) => {
      const key = program.programStatus?.trim() || "BOR-approved";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, value]) => `${name} ${formatNumber(value, 0)}`)
    .join("; ");
  addFact(facts, {
    id: "extension",
    title: "Extension",
    body: `Published extension programs: ${formatNumber(home.extensionPrograms.length, 0)}${extensionStatus ? ` (${extensionStatus})` : ""}. Extension partners: ${formatNumber(home.extensionPartners.length, 0)}.`,
    href: "/extension",
    keywords: "extension community partners bor-approved",
  });

  const documentList = allDocuments.length ? allDocuments : home.documents;
  if (documentList.length) {
    addFact(facts, {
      id: "documents",
      title: "Institutional documents",
      body: documentList
        .map((document) => `${document.title} (${document.category ?? "Document"}${"effectiveYear" in document && document.effectiveYear ? ` ${document.effectiveYear}` : ""})`)
        .join("; "),
      href: "/documents",
      keywords: "documents reports strategic plan policies",
    });
  }

  if (officials.length) {
    addFact(facts, {
      id: "officials",
      title: "University officials",
      body: `Leadership as of ${OFFICIALS_AS_OF}: ${officials.map((person) => `${person.name}, ${person.position}${person.office ? ` (${person.office})` : ""}`).join("; ")}.`,
      href: "/about/officials",
      keywords: "officials president vice president board of regents leadership",
    });
  }

  const licensureTotals = licensureRows.filter((row) => row.isTotalRow);
  if (licensureTotals.length || licensureRows.length) {
    const totalLine = licensureTotals
      .map((row) => `FY ${row.fiscalYear} ${formatPercent(row.passingRate)}${row.firstTimePassers != null && row.firstTimeTakers != null ? ` (${formatNumber(row.firstTimePassers, 0)}/${formatNumber(row.firstTimeTakers, 0)})` : ""}`)
      .join("; ");
    const programLine = licensureRows
      .filter((row) => !row.isTotalRow)
      .slice(0, 30)
      .map((row) => `${row.programName}${row.examination ? ` ${row.examination}` : ""} FY ${row.fiscalYear} ${formatPercent(row.passingRate)}`)
      .join("; ");
    addFact(facts, {
      id: "licensure-summary",
      title: "Licensure examinations",
      body: `${totalLine ? `University first-time passing rates: ${totalLine}.` : ""}${programLine ? ` Program results: ${programLine}.` : ""}`,
      href: "/students/licensure",
      keywords: "licensure board exam passing rate first-time takers",
    });
  }

  if (employabilityRows.length) {
    const latestYear = Math.max(...employabilityRows.map((row) => row.reportingYear ?? 0));
    const latest = employabilityRows.filter((row) => (row.reportingYear ?? 0) === latestYear);
    addFact(facts, {
      id: "employability-summary",
      title: "Graduate employability",
      body: `Published employability observations${latestYear ? ` for ${latestYear}` : ""}: ${latest
        .map((row) => `${row.collegeName} ${formatPercent(row.rate)}${row.employed != null && row.graduates != null ? ` (${formatNumber(row.employed, 0)}/${formatNumber(row.graduates, 0)})` : ""}`)
        .join("; ")}.`,
      href: "/students/employability",
      keywords: "employability employed graduates jobs cohort",
    });
  }

  if (awardRows.length) {
    addFact(facts, {
      id: "awards-summary",
      title: "Student awards",
      body: `${formatNumber(awardRows.length, 0)} published student awards: ${awardRows
        .map((row) => `${row.recipient}${row.awardRank ? ` ${row.awardRank}` : ""}${row.eventName ? ` (${row.eventName})` : ""}`)
        .join("; ")}.`,
      href: "/students/awards",
      keywords: "awards students contest competition",
    });
  }

  if (researchTitles.length || publicationTitles.length || utilizationRows.length || grantRows.length) {
    addFact(facts, {
      id: "research-records",
      title: "Research records",
      body: [
        researchTitles.length ? `Completed: ${researchTitles.map((row) => `${row.title} (FY ${row.fiscalYear})`).join("; ")}.` : "",
        publicationTitles.length ? `Publications: ${publicationTitles.map((row) => `${row.publishedTitle}${row.journal ? ` in ${row.journal}` : ""} (FY ${row.fiscalYear})`).join("; ")}.` : "",
        utilizationRows.length ? `Utilization: ${utilizationRows.map((row) => `${row.researchTitle || row.productName || "Utilization"} (FY ${row.fiscalYear})`).join("; ")}.` : "",
        grantRows.length ? `Grants: ${grantRows.map((row) => `${row.title}${row.fundingAgency ? ` / ${row.fundingAgency}` : ""}${row.amount != null ? ` ${formatPeso(Number(row.amount))}` : ""}`).join("; ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      href: "/research",
      keywords: "research completed publications utilization grants titles",
    });
  }

  if (extensionTitles.length) {
    addFact(facts, {
      id: "extension-programs",
      title: "Extension programs",
      body: extensionTitles
        .map((row) => `${row.title}${row.programStatus ? ` (${row.programStatus})` : ""}${row.location ? ` in ${row.location}` : ""}`)
        .join("; "),
      href: "/extension",
      keywords: "extension programs community bor-approved",
    });
  }

  if (budgetRows.length) {
    const byYear = new Map<number, { budget: number; allotment: number; obligation: number; disbursement: number }>();
    for (const row of budgetRows) {
      const current = byYear.get(row.fiscalYear) ?? { budget: 0, allotment: 0, obligation: 0, disbursement: 0 };
      current.budget += Number(row.budget ?? 0);
      current.allotment += Number(row.allotment ?? 0);
      current.obligation += Number(row.obligation ?? 0);
      current.disbursement += Number(row.disbursement ?? 0);
      byYear.set(row.fiscalYear, current);
    }
    addFact(facts, {
      id: "budget-summary",
      title: "Budget",
      body: `Published budget by fiscal year: ${[...byYear.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([year, value]) => `FY ${year} budget ${formatPeso(value.budget)}, allotment ${formatPeso(value.allotment)}, obligation ${formatPeso(value.obligation)}, disbursement ${formatPeso(value.disbursement)}`)
        .join("; ")}.`,
      href: "/budget",
      keywords: "budget allotment obligation disbursement funds pap",
    });
  }

  addFact(facts, {
    id: "assets-summary",
    title: "Assets",
    body: `Published assets: land ${formatNumber(landAssets.length, 0)}; buildings ${formatNumber(buildingAssets.length, 0)}${buildingAssets.length ? ` (${buildingAssets.map((item) => item.name).join("; ")})` : ""}; laboratories ${formatNumber(laboratoryAssets.length, 0)}${laboratoryAssets.length ? ` (${laboratoryAssets.map((item) => item.name).join("; ")})` : ""}; accommodation ${formatNumber(accommodationAssets.length, 0)}; vehicles ${formatNumber(vehicleAssets.length, 0)}.`,
    href: "/assets",
    keywords: "assets land buildings laboratories vehicles accommodation",
  });

  if (infrastructureRows.length) {
    addFact(facts, {
      id: "infrastructure-summary",
      title: "Infrastructure",
      body: `${formatNumber(infrastructureRows.length, 0)} published infrastructure projects: ${infrastructureRows
        .map((row) => {
          const campus = row.campusId ? campusName[row.campusId] : null;
          return `${row.name}${campus ? ` (${campus})` : ""}${row.projectStatus ? ` ${row.projectStatus}` : ""}${row.projectCost != null ? ` ${formatPeso(Number(row.projectCost))}` : ""}`;
        })
        .join("; ")}.`,
      href: "/infrastructure",
      keywords: "infrastructure projects construction ongoing",
    });
  }

  if (internationalPartners.length || internationalMemberships.length) {
    addFact(facts, {
      id: "internationalization-summary",
      title: "Internationalization",
      body: [
        internationalPartners.length
          ? `Partners: ${internationalPartners.map((row) => `${row.institution}${row.country ? ` (${row.country})` : ""}`).join("; ")}.`
          : "",
        internationalMemberships.length
          ? `Memberships: ${internationalMemberships.map((row) => row.organization).join("; ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      href: "/internationalization",
      keywords: "international partners memberships moa mou",
    });
  }

  if (flagships.length) {
    addFact(facts, {
      id: "flagship-summary",
      title: "Flagship programs",
      body: flagships
        .map((row) => `${row.title}${row.shortDescription ? ` — ${row.shortDescription}` : ""}${row.office ? ` (${row.office})` : ""}`)
        .join("; "),
      href: "/flagship",
      keywords: "flagship programs priority",
    });
  }

  addFact(facts, {
    id: "updated",
    title: "Latest publish",
    body: home.latestPublish
      ? `The latest published dataset timestamp is ${formatDate(home.latestPublish)}.`
      : "A latest publish timestamp is not available.",
    href: "/",
    keywords: "updated as of published date",
  });

  return facts;
}

async function loadChatCorpus() {
  const facts = buildStaticFacts();
  try {
    facts.push(...(await loadPublishedFacts()));
  } catch {
    addFact(facts, {
      id: "published-unavailable",
      title: "Published metrics",
      body: "Live KPI, enrollment, performance, research, and personnel figures could not be loaded right now. Campus, college, vision, mission, and administrative-order information is still available.",
      href: "/",
      keywords: "unavailable error metrics kpis",
    });
  }
  return {
    facts,
    briefing: factsToBriefingText(facts),
  };
}

export const getChatCorpus = unstable_cache(loadChatCorpus, ["chat-corpus"], {
  revalidate: 300,
  tags: ["public-data"],
});
