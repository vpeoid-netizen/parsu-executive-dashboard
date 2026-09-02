import { collegeAbbrev, collegeFullName, collegeSortIndex } from "@/lib/import/normalize";

export function hasCopcNumber(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function formatProgramAuthority(value: string | null | undefined) {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (/RRPA/i.test(text)) {
    return text.replace(/^COPC\s+/i, "");
  }
  if (/^COPC\b/i.test(text)) return text;
  return `COPC ${text}`;
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

export function programStatusIndicators(program: {
  phaseOut?: boolean | null;
  accreditable?: boolean | null;
  programStatus?: string | null;
  accreditationRaw?: string | null;
}) {
  const status = `${program.programStatus ?? ""} ${program.accreditationRaw ?? ""}`;
  const isNew = /new program/i.test(status);
  const isNotAccreditable = /not accreditable/i.test(status) || (program.accreditable === false && !isNew);
  const indicators: { label: string; tone: "success" | "neutral" | "warning" }[] = [];
  if (program.phaseOut) indicators.push({ label: "Phasing out", tone: "warning" });
  if (isNew) indicators.push({ label: "New program", tone: "success" });
  else if (isNotAccreditable) indicators.push({ label: "Not accreditable", tone: "neutral" });
  return indicators;
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
