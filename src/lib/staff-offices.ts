export const VP_OFFICE_ORDER = [
  "Academic Affairs",
  "Administration and Finance",
  "Research & Extension",
  "Executive Operations",
] as const;

export const VP_ADMIN_FINANCE_OFFICE = "Office of the Vice President for Administration and Finance";
export const CAO_ADMINISTRATION_OFFICE = "Office of the Chief Administrative Officer for Administration";

export const STAFF_DEPARTMENT_ORDER = [
  "Support to Presidential Operation",
  "Executive Operations",
  "Support to Academic Operation (STO)",
  "General Administration and Support Services (GASS)",
  "Research and Extension Operations",
  "Academic Delivery Units",
  "Commission on Audit",
] as const;

export type StaffOfficeRow = {
  department: string | null;
  office: string | null;
  unit: string | null;
  campus: string;
  total: number | null;
  counts: { appointment?: Record<string, number> };
};

export type StaffOfficeGroup = {
  key: string;
  title: string;
  campus: string;
  department: string | null;
  total: number;
  counts: { appointment?: Record<string, number> };
  units: StaffOfficeRow[];
};

type StaffCountRow = {
  office: string | null;
  unit: string | null;
  total: number | null;
  counts: { appointment?: Record<string, number> };
};

export function appointmentHeadcount(counts: { appointment?: Record<string, number> } | null | undefined) {
  const appointment = counts?.appointment ?? {};
  return (appointment.Permanent ?? 0) + (appointment.Casual ?? 0) + (appointment["Job Order"] ?? 0);
}

export function alignStaffTotalsToAppointments<T extends StaffCountRow>(rows: T[]): T[] {
  return rows.map((row) => {
    const total = appointmentHeadcount(row.counts);
    return row.total === total ? row : { ...row, total };
  });
}

export function applyNtpOfficePermanentRevision<T extends StaffCountRow>(rows: T[]): T[] {
  const vp = rows.find((row) => row.office === VP_ADMIN_FINANCE_OFFICE && !row.unit);
  const cao = rows.find((row) => row.office === CAO_ADMINISTRATION_OFFICE && !row.unit);
  if (!vp || !cao) return rows;
  const vpPermanent = vp.counts.appointment?.Permanent ?? 0;
  const caoPermanent = cao.counts.appointment?.Permanent ?? 0;
  if (vpPermanent !== 3 || caoPermanent !== 0) return rows;
  return rows.map((row) => {
    if (row === vp) {
      return {
        ...row,
        total: Math.max(0, (row.total ?? 3) - 1),
        counts: {
          ...row.counts,
          appointment: { ...row.counts.appointment, Permanent: 2 },
        },
      };
    }
    if (row === cao) {
      return {
        ...row,
        total: (row.total ?? 0) + 1,
        counts: {
          ...row.counts,
          appointment: { ...row.counts.appointment, Permanent: 1 },
        },
      };
    }
    return row;
  });
}

export function isVicePresidentOffice(office: string | null | undefined) {
  if (!office) return false;
  const text = office.trim();
  return /^VP for /i.test(text) || /vice president/i.test(text);
}

export function staffOfficeTitle(row: StaffOfficeRow) {
  if (row.office) return row.office;
  if (row.unit) return row.unit;
  if (row.department && row.campus && row.campus !== "Central / unspecified") {
    return `${row.department} — ${row.campus}`;
  }
  return row.department ?? "Unspecified office";
}

export function appointmentMixNote(counts: { appointment?: Record<string, number> } | null | undefined) {
  const appointment = counts?.appointment ?? {};
  const parts = (["Permanent", "Casual", "Job Order"] as const)
    .filter((key) => (appointment[key] ?? 0) > 0)
    .map((key) => `${appointment[key]} ${key}`);
  return parts.length ? parts.join(", ") : "No assigned personnel";
}

function vpOrderIndex(office: string | null) {
  if (!office) return VP_OFFICE_ORDER.length;
  const lower = office.toLowerCase();
  const index = VP_OFFICE_ORDER.findIndex((label) => {
    if (label === "Research & Extension") {
      return lower.includes("research") && lower.includes("extension");
    }
    if (label === "Executive Operations") {
      return lower.includes("executive operations");
    }
    return lower.includes(label.toLowerCase());
  });
  return index === -1 ? VP_OFFICE_ORDER.length : index;
}

function departmentOrderIndex(department: string) {
  const index = STAFF_DEPARTMENT_ORDER.indexOf(department as (typeof STAFF_DEPARTMENT_ORDER)[number]);
  return index === -1 ? STAFF_DEPARTMENT_ORDER.length : index;
}

function groupKey(row: StaffOfficeRow) {
  if (isVicePresidentOffice(row.office)) return `vp::${row.office}`;
  return `${row.department ?? ""}::${row.office ?? ""}::${row.campus}`;
}

function toOfficeGroups(rows: StaffOfficeRow[]): StaffOfficeGroup[] {
  const buckets = new Map<string, StaffOfficeRow[]>();
  for (const row of rows) {
    const key = groupKey(row);
    const current = buckets.get(key) ?? [];
    current.push(row);
    buckets.set(key, current);
  }
  return [...buckets.entries()].map(([key, items]) => {
    const officeLevel = items.find((item) => !item.unit) ?? null;
    const units = items
      .filter((item) => item.unit)
      .sort((a, b) => (a.unit ?? "").localeCompare(b.unit ?? "", "en"));
    const representative = officeLevel ?? items[0]!;
    return {
      key,
      title: officeLevel ? staffOfficeTitle(officeLevel) : (representative.office ?? staffOfficeTitle(representative)),
      campus: representative.campus,
      department: representative.department,
      total: officeLevel?.total ?? 0,
      counts: officeLevel?.counts ?? { appointment: { Permanent: 0, Casual: 0, "Job Order": 0 } },
      units,
    };
  });
}

export const ACADEMIC_DELIVERY_DEPARTMENT = "Academic Delivery Units";
export const GOA_CAMPUS_LABEL = "Goa Campus";

const GOA_COLLEGE_TITLE_MARKERS = [
  "arts and humanities",
  "business and management",
  "college of education",
  "engineering and computational",
  "college of science",
];

export function isGoaCampusLabel(campus: string | null | undefined) {
  return /\bgoa\b/i.test(campus ?? "");
}

export function isGoaAcademicDeliveryOffice(office: { campus: string; title: string }) {
  if (isGoaCampusLabel(office.campus)) return true;
  const title = office.title.toLowerCase();
  return GOA_COLLEGE_TITLE_MARKERS.some((marker) => title.includes(marker));
}

export function partitionAcademicDeliveryOffices<T extends { campus: string; title: string }>(offices: T[]) {
  const goa: T[] = [];
  const other: T[] = [];
  for (const office of offices) {
    if (isGoaAcademicDeliveryOffice(office)) goa.push(office);
    else other.push(office);
  }
  return { goa, other };
}

export function staffOfficeHeadcount(group: StaffOfficeGroup) {
  return group.total + group.units.reduce((sum, unit) => sum + (unit.total ?? 0), 0);
}

export function staffDepartmentHeadcount(offices: StaffOfficeGroup[]) {
  return offices.reduce((sum, office) => sum + staffOfficeHeadcount(office), 0);
}

export function groupStaffOffices(rows: StaffOfficeRow[]) {
  const revised = alignStaffTotalsToAppointments(applyNtpOfficePermanentRevision(rows));
  const vicePresidentRows: StaffOfficeRow[] = [];
  const rest: StaffOfficeRow[] = [];
  for (const row of revised) {
    if (isVicePresidentOffice(row.office)) vicePresidentRows.push(row);
    else rest.push(row);
  }

  const vicePresidents = toOfficeGroups(vicePresidentRows).sort(
    (a, b) => vpOrderIndex(a.title) - vpOrderIndex(b.title) || a.title.localeCompare(b.title, "en"),
  );

  const byDepartment = new Map<string, StaffOfficeRow[]>();
  for (const row of rest) {
    const key = row.department?.trim() || "Other units";
    const current = byDepartment.get(key) ?? [];
    current.push(row);
    byDepartment.set(key, current);
  }

  const departments = [...byDepartment.entries()]
    .sort((a, b) => departmentOrderIndex(a[0]) - departmentOrderIndex(b[0]) || a[0].localeCompare(b[0]))
    .map(([title, offices]) => ({
      title,
      offices: toOfficeGroups(offices).sort((a, b) => a.title.localeCompare(b.title, "en")),
    }));

  return { vicePresidents, departments };
}
