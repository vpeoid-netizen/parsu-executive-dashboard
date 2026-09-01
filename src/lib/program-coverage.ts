import { collegeAbbrev, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";

export function hasCopcNumber(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function coverageCenterLabel(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return { primary: "Data not yet available" };
  }
  const pct = (numerator / denominator) * 100;
  const primary =
    numerator === denominator || pct === 0 || Math.abs(pct - Math.round(pct)) < 1e-9
      ? `${Math.round(pct)}%`
      : `${pct.toFixed(1)}%`;
  return { primary, secondary: `${numerator}/${denominator}` };
}

export function programsByCollegeSlices(programs: { collegeCode: string | null }[]) {
  const counts = new Map<string | null, number>();
  for (const program of programs) {
    counts.set(program.collegeCode, (counts.get(program.collegeCode) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => collegeSortIndex(a[0]) - collegeSortIndex(b[0]))
    .map(([code, value]) => ({
      code: code ?? "",
      name: collegeAbbrev(code),
      fullName: collegeFullName(code),
      value,
    }));
}
