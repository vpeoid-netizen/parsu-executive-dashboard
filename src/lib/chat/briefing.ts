import { ADMINISTRATIVE_ORDERS, administrativeOrderLabel } from "@/lib/administrative-orders";
import { CAMPUSES_DIRECTORY } from "@/lib/about/campuses";
import { COLLEGES_DIRECTORY } from "@/lib/about/colleges";
import { CORE_VALUES, OFFICIALS_AS_OF, VMGO_SECTIONS } from "@/lib/about/content";
import { UNIVERSITY_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
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
import {
  alignStaffTotalsToAppointments,
  groupStaffOffices,
  type StaffOfficeRow,
} from "@/lib/staff-offices";

type CountGroups = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
};

function sumCountGroup(rows: { total: number | null; countsJson: string }[]) {
  const appointment: Record<string, number> = {};
  const rank: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    const counts = JSON.parse(row.countsJson) as CountGroups;
    const appointmentSum = Object.values(counts.appointment ?? {}).reduce((sum, value) => sum + value, 0);
    total += appointmentSum || (row.total ?? 0);
    for (const [key, value] of Object.entries(counts.appointment ?? {})) {
      appointment[key] = (appointment[key] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(counts.rank ?? {})) {
      rank[key] = (rank[key] ?? 0) + value;
    }
  }
  return { total, appointment, rank };
}

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

  const facts: ChatFact[] = [];
  const facultyCounts = sumCountGroup(home.faculty);
  const staffCounts = sumCountGroup(home.staff);
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
    body: `Published faculty headcount is ${formatNumber(facultyCounts.total, 0)}. Appointment mix: ${mixLine(facultyCounts.appointment) || "not specified"}. Rank mix: ${mixLine(facultyCounts.rank) || "not specified"}.`,
    href: "/personnel/faculty",
    keywords: "faculty teachers professors instructors permanent temporary cos",
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
  const facultyByCollege = new Map<string, number>();
  for (const row of facultyRows) {
    const code = row.collegeId ? collegeById[row.collegeId]?.code : undefined;
    const label = collegeAbbrev(code);
    facultyByCollege.set(label, (facultyByCollege.get(label) ?? 0) + (row.total ?? 0));
  }
  if (facultyByCollege.size) {
    addFact(facts, {
      id: "faculty-by-college",
      title: "Faculty by college",
      body: `Published faculty by college: ${[...facultyByCollege.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => `${name} ${formatNumber(value, 0)}`)
        .join("; ")}.`,
      href: "/personnel/faculty",
      keywords: "faculty by college teachers professors instructors",
    });
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

  if (home.documents.length) {
    addFact(facts, {
      id: "documents",
      title: "Institutional documents",
      body: home.documents
        .map((document) => `${document.title} (${document.category ?? "Document"})`)
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

export async function getChatCorpus() {
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
    generatedAt: new Date().toISOString(),
  };
}
