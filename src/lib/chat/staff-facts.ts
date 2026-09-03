import { type ChatFact } from "@/lib/chat/facts";
import { formatNumber } from "@/lib/format";
import {
  appointmentMixNote,
  staffDepartmentHeadcount,
  staffOfficeHeadcount,
  type StaffOfficeGroup,
} from "@/lib/staff-offices";

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function officeLine(group: StaffOfficeGroup) {
  const mix = appointmentMixNote(group.counts);
  const office = `${group.title} ${formatNumber(group.total, 0)}${mix !== "No assigned personnel" ? ` (${mix})` : ""}`;
  if (!group.units.length) return office;
  const units = group.units
    .map((unit) => {
      const unitMix = appointmentMixNote(unit.counts);
      return `${unit.unit ?? "Unit"} ${formatNumber(unit.total ?? 0, 0)}${unitMix !== "No assigned personnel" ? ` (${unitMix})` : ""}`;
    })
    .join("; ");
  return `${office}. Units: ${units}`;
}

export function staffFactsFromGrouped(grouped: {
  vicePresidents: StaffOfficeGroup[];
  departments: Array<{ title: string; offices: StaffOfficeGroup[] }>;
}): ChatFact[] {
  const facts: ChatFact[] = [];
  const vpTotal = grouped.vicePresidents.reduce((sum, office) => sum + staffOfficeHeadcount(office), 0);
  if (grouped.vicePresidents.length) {
    facts.push({
      id: "ntp-vice-presidents",
      title: "Offices of the Vice Presidents",
      body: `Published non-teaching personnel in the Offices of the Vice Presidents total ${formatNumber(vpTotal, 0)}. ${grouped.vicePresidents.map(officeLine).join("; ")}.`,
      href: "/personnel/non-teaching",
      keywords: "vice president vp offices personnel ntp staff headcount",
    });
  }

  for (const department of grouped.departments) {
    const total = staffDepartmentHeadcount(department.offices);
    facts.push({
      id: `ntp-department-${slug(department.title)}`,
      title: `${department.title} personnel`,
      body: `Published non-teaching personnel under ${department.title} offices total ${formatNumber(total, 0)}. Offices: ${department.offices.map(officeLine).join("; ")}.`,
      href: "/personnel/non-teaching",
      keywords: `${department.title} offices units personnel ntp staff headcount${
        /executive operations/i.test(department.title) ? " vpeo vpeoid" : ""
      }`,
    });
  }

  return facts;
}
