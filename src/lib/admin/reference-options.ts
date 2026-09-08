import { prisma } from "@/lib/db";
import { STAFF_DEPARTMENT_ORDER } from "@/lib/staff-offices";
import { withEmpty, type SelectOption } from "@/lib/admin/options";

export async function campusCollegeOptions() {
  const [campuses, colleges] = await Promise.all([
    prisma.campus.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.college.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    campuses: withEmpty(campuses.map((item) => ({ value: item.id, label: item.name }))),
    colleges: withEmpty(colleges.map((item) => ({ value: item.id, label: item.name }))),
  };
}

export function departmentOptions(existing: Array<string | null>): SelectOption[] {
  const labels = [...new Set([...STAFF_DEPARTMENT_ORDER, ...existing.filter(Boolean)])] as string[];
  return withEmpty(labels.map((label) => ({ value: label, label })));
}
