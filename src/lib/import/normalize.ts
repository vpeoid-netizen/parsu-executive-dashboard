import { CAMPUSES, COLLEGES } from "@/lib/constants";

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchCampus(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = normalizeKey(raw);
  for (const campus of CAMPUSES) {
    if (campus.aliases.some((alias) => key === normalizeKey(alias) || key.includes(normalizeKey(alias)))) {
      return campus.code;
    }
  }
  return null;
}

export function matchCollege(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = normalizeKey(raw);
  if (key.length <= 5) {
    const byAbbrev = COLLEGES.find((college) => college.abbrev.toLowerCase() === key);
    if (byAbbrev) return byAbbrev.code;
    const byCode = COLLEGES.find((college) => college.code.toLowerCase() === key);
    if (byCode) return byCode.code;
  }
  for (const college of COLLEGES) {
    if (college.aliases.some((alias) => key === normalizeKey(alias))) {
      return college.code;
    }
  }
  for (const college of COLLEGES) {
    if (
      college.aliases.some((alias) => {
        const normalized = normalizeKey(alias);
        return normalized.includes(" ") && key.includes(normalized);
      })
    ) {
      return college.code;
    }
  }
  return null;
}

function resolveCollege(code: string | null | undefined) {
  if (!code) return null;
  return (
    COLLEGES.find((college) => college.code === code || college.abbrev === code) ??
    COLLEGES.find((college) => college.code === matchCollege(code)) ??
    null
  );
}

export function campusDisplayName(code: string): string {
  return CAMPUSES.find((campus) => campus.code === code)?.name ?? code;
}

export function collegeFullName(code: string | null | undefined): string {
  return resolveCollege(code)?.name ?? (code ? code : "Unspecified");
}

export function collegeAbbrev(code: string | null | undefined): string {
  return resolveCollege(code)?.abbrev ?? (code ? code : "Unspecified");
}

export function collegeDisplayName(code: string): string {
  return collegeFullName(code);
}

export function collegeSortIndex(code: string | null | undefined): number {
  const resolved = resolveCollege(code)?.code ?? code;
  if (!resolved) return COLLEGES.length;
  const index = COLLEGES.findIndex((college) => college.code === resolved);
  return index === -1 ? COLLEGES.length : index;
}

export function collegeChartPoint<T extends Record<string, number>>(code: string | null | undefined, values: T) {
  return {
    code: code ?? "",
    name: collegeAbbrev(code),
    fullName: collegeFullName(code),
    ...values,
  };
}

export const ACADEMIC_RANK_GROUPS = [
  "Instructor",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "University Professor",
  "Others",
] as const;

export type AcademicRankGroup = (typeof ACADEMIC_RANK_GROUPS)[number];

export function normalizeAcademicRank(raw: string | null | undefined): AcademicRankGroup {
  if (!raw) return "Others";
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || /academic rank|list of completed|research publication/i.test(text)) return "Others";
  if (/university professor/i.test(text)) return "University Professor";
  if (/associate professor/i.test(text)) return "Associate Professor";
  if (/assistant professor/i.test(text)) return "Assistant Professor";
  if (/\bprofessors?\b/i.test(text)) return "Professor";
  if (/instructor/i.test(text)) return "Instructor";
  return "Others";
}
