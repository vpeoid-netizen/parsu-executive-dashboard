import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sumFacultyCounts, sumStaffCounts } from "../src/lib/personnel-counts";
import { isFacultyOnlyWorkbook, parseWorkbook, type ParsedWorkbook } from "../src/lib/import/parse-workbook";

function emptyWorkbook(facultyCount: number): ParsedWorkbook {
  return {
    asOfHints: {},
    programs: [],
    faculty: Array.from({ length: facultyCount }, (_, index) => ({
      campusCode: "GOA",
      collegeCode: "COS",
      total: 1,
      counts: {},
      sourceRow: index + 7,
    })),
    staff: [],
    enrollment: [],
    licensure: [],
    awards: [],
    employability: [],
    performance: [],
    researchCompleted: [],
    researchUtilization: [],
    researchPublications: [],
    extensionPrograms: [],
    issues: [],
  };
}

describe("personnel count totals", () => {
  it("uses the faculty worksheet total even when appointment columns add to more", () => {
    const summed = sumFacultyCounts([
      {
        total: 12,
        countsJson: JSON.stringify({
          appointment: { Permanent: 9, Temporary: 1, COS: 3 },
          rank: { Instructor: 5 },
          education: { "Bachelor's Degree": 7, "Master's Degree": 5, "Doctorate Degree": 2 },
        }),
      },
    ]);
    expect(summed.total).toBe(12);
    expect(summed.appointment.Permanent).toBe(9);
    expect(summed.education["Doctorate Degree"]).toBe(2);
  });

  it("keeps NTP totals on appointment subtotals when those are present", () => {
    const summed = sumStaffCounts([
      {
        total: 10,
        countsJson: JSON.stringify({
          appointment: { Permanent: 8, Casual: 3 },
        }),
      },
    ]);
    expect(summed.total).toBe(11);
  });
});

describe("faculty-only workbook detection", () => {
  it("is true when only faculty rows are present", () => {
    expect(isFacultyOnlyWorkbook(emptyWorkbook(11))).toBe(true);
  });

  it("is false when another dataset is also present", () => {
    const parsed = emptyWorkbook(11);
    parsed.staff = [
      {
        campusCode: "GOA",
        department: "Administration",
        office: "Records",
        unit: null,
        total: 1,
        counts: {},
        sourceRow: 8,
      },
    ];
    expect(isFacultyOnlyWorkbook(parsed)).toBe(false);
  });
});

const correctedFacultyFile = "/Users/kiergasga/Downloads/3-Faculty-Members.xlsx";

describe.skipIf(!existsSync(correctedFacultyFile))("corrected faculty worksheet", () => {
  it("reads group totals and education from the added total columns", async () => {
    const parsed = await parseWorkbook(correctedFacultyFile);
    const total = parsed.faculty.reduce((sum, row) => sum + (row.total ?? 0), 0);
    const science = parsed.faculty.find((row) => row.collegeCode === "COS");
    expect(parsed.faculty).toHaveLength(11);
    expect(total).toBe(270);
    expect(science?.total).toBe(14);
    expect(science?.counts.rank?.Instructor).toBe(9);
    expect(science?.counts.education?.["Bachelor's Degree"]).toBe(6);
    expect(science?.counts.education?.["Master's Degree"]).toBe(7);
  });
});
