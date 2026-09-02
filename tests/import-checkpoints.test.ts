import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseWorkbook } from "../src/lib/import/parse-workbook";

describe("Executive-Dashboard.xlsx import checkpoints", () => {
  it("parses the institutional workbook without fabricating values", async () => {
    const file = path.resolve(process.cwd(), "Executive-Dashboard.xlsx");
    const parsed = await parseWorkbook(file);
    expect(parsed.programs).toHaveLength(42);
    expect(parsed.programs.filter((item) => item.copcNumber).length).toBe(42);
    expect(parsed.programs.filter((item) => item.phaseOut)).toHaveLength(3);
    expect(parsed.programs.some((item) => item.name.endsWith("*"))).toBe(false);
    const eoid = parsed.staff.find((row) => /executive operations/i.test(row.office ?? ""));
    expect(eoid?.total).toBe(0);
    expect(eoid?.counts.appointment?.Permanent).toBe(0);
    const vpAdmin = parsed.staff.find(
      (row) => /vice president for administration and finance/i.test(row.office ?? "") && !row.unit,
    );
    const caoAdmin = parsed.staff.find(
      (row) => /chief administrative officer for administration/i.test(row.office ?? "") && !row.unit,
    );
    expect(vpAdmin?.counts.appointment?.Permanent).toBe(2);
    expect(vpAdmin?.total).toBe(2);
    expect(caoAdmin?.counts.appointment?.Permanent).toBe(1);
    expect(caoAdmin?.total).toBe(1);
    expect(parsed.staff.find((row) => /alumni affairs/i.test(row.office ?? ""))?.total).toBe(0);
    expect(parsed.staff.find((row) => /gender/i.test(row.office ?? ""))?.total).toBe(0);
    expect(parsed.staff.find((row) => /international affairs/i.test(row.office ?? ""))?.total).toBe(0);
    const enrollmentByPeriod = new Map<string, number>();
    for (const row of parsed.enrollment) {
      const key = `${row.academicYearStart}-${row.semester}`;
      enrollmentByPeriod.set(key, (enrollmentByPeriod.get(key) ?? 0) + (row.headcount ?? 0));
    }
    expect(enrollmentByPeriod.get("2024-2")).toBe(8855);
    expect(enrollmentByPeriod.get("2025-1")).toBe(9116);
    expect(enrollmentByPeriod.get("2025-2")).toBe(8964);
    expect(parsed.performance.some((row) => row.fiscalYear === 2024)).toBe(true);
    expect(parsed.performance.some((row) => row.fiscalYear === 2026 && row.isPartial)).toBe(true);
    expect(parsed.researchCompleted.filter((row) => row.fiscalYear === 2026)).toHaveLength(39);
    expect(parsed.researchCompleted.filter((row) => row.fiscalYear === 2025)).toHaveLength(70);
    expect(parsed.researchPublications.filter((row) => row.fiscalYear === 2025)).toHaveLength(21);
    expect(parsed.researchUtilization.filter((row) => row.fiscalYear === 2024)).toHaveLength(6);
    expect(parsed.researchUtilization.filter((row) => row.fiscalYear === 2025)).toHaveLength(6);
    expect(parsed.researchUtilization.filter((row) => row.fiscalYear === 2026)).toHaveLength(2);
    const fy2025Licensure = parsed.licensure.find((row) => row.fiscalYear === 2025 && row.isTotalRow);
    const fy2026Licensure = parsed.licensure.find((row) => row.fiscalYear === 2026 && row.isTotalRow);
    expect(fy2025Licensure?.firstTimePassers).toBe(306);
    expect(fy2025Licensure?.firstTimeTakers).toBe(381);
    expect(fy2026Licensure?.firstTimePassers).toBe(95);
    expect(fy2026Licensure?.firstTimeTakers).toBe(143);
    expect(parsed.issues.some((issue) => issue.code === "LICENSURE_TOTAL_FROM_PERFORMANCE")).toBe(true);
    expect(parsed.issues.some((issue) => issue.code === "SOURCE_CONFLICT_LICENSURE")).toBe(false);
  }, 30000);
});
