import { describe, expect, it } from "vitest";
import { coverageCenterLabel, hasCopcNumber, programsByCollegeSlices } from "../src/lib/program-coverage";
import { appointmentMixNote, groupStaffOffices } from "../src/lib/staff-offices";
import { shortChartPeriodLabel } from "../src/lib/periods";

describe("program coverage", () => {
  it("labels complete coverage as 100% with a fraction", () => {
    expect(coverageCenterLabel(42, 42)).toEqual({ primary: "100%", secondary: "42/42" });
    expect(coverageCenterLabel(31, 31)).toEqual({ primary: "100%", secondary: "31/31" });
  });

  it("groups COPC programs by college abbrev", () => {
    const slices = programsByCollegeSlices([
      { collegeCode: "CECS" },
      { collegeCode: "CECS" },
      { collegeCode: "CEDU" },
    ]);
    expect(slices[0]?.name).toBeTruthy();
    expect(slices.find((item) => item.code === "CECS")?.value).toBe(2);
    expect(hasCopcNumber("COPC-1")).toBe(true);
    expect(hasCopcNumber("  ")).toBe(false);
  });
});

describe("staff office grouping", () => {
  it("puts the four VP offices first and groups remaining rows by department", () => {
    const grouped = groupStaffOffices([
      {
        department: "Executive Operations",
        office: "Legal Services",
        unit: null,
        campus: "Goa Campus",
        total: 4,
        counts: { appointment: { Permanent: 4 } },
      },
      {
        department: null,
        office: "VP for Research & Extension",
        unit: null,
        campus: "Central / unspecified",
        total: 1,
        counts: { appointment: { Casual: 1 } },
      },
      {
        department: null,
        office: "VP for Academic Affairs",
        unit: null,
        campus: "Central / unspecified",
        total: 1,
        counts: { appointment: { "Job Order": 1 } },
      },
      {
        department: "Commission on Audit",
        office: null,
        unit: null,
        campus: "Caramoan Campus",
        total: 19,
        counts: { appointment: { Permanent: 17, Casual: 1, "Job Order": 1 } },
      },
    ]);
    expect(grouped.vicePresidents.map((row) => row.title)).toEqual([
      "VP for Academic Affairs",
      "VP for Research & Extension",
    ]);
    expect(grouped.departments.map((item) => item.title)).toEqual(["Executive Operations", "Commission on Audit"]);
    expect(grouped.departments[1]!.offices[0]!.title).toBe("Commission on Audit — Caramoan Campus");
    expect(appointmentMixNote({ appointment: { Permanent: 3 } })).toBe("3 Permanent");
    expect(appointmentMixNote({})).toBe("No assigned personnel");
  });

  it("nests units under offices and treats long VP office names as VP offices", () => {
    const grouped = groupStaffOffices([
      {
        department: null,
        office: "Office of the Vice President for Executive Operations & Institutional Development",
        unit: null,
        campus: "Central / unspecified",
        total: 0,
        counts: { appointment: { Permanent: 0, Casual: 0, "Job Order": 0 } },
      },
      {
        department: "General Administration and Support Services (GASS)",
        office: "Office of the Chief Administrative Officer for Administration",
        unit: null,
        campus: "Goa Campus",
        total: 0,
        counts: { appointment: { Permanent: 0, Casual: 0, "Job Order": 0 } },
      },
      {
        department: "General Administration and Support Services (GASS)",
        office: "Office of the Chief Administrative Officer for Administration",
        unit: "Human Resource Management Unit",
        campus: "Goa Campus",
        total: 4,
        counts: { appointment: { Permanent: 3, Casual: 1 } },
      },
    ]);
    expect(grouped.vicePresidents).toHaveLength(1);
    expect(grouped.vicePresidents[0]!.total).toBe(0);
    expect(grouped.departments[0]!.offices).toHaveLength(1);
    expect(grouped.departments[0]!.offices[0]!.total).toBe(0);
    expect(grouped.departments[0]!.offices[0]!.units.map((item) => item.unit)).toEqual(["Human Resource Management Unit"]);
  });
});

describe("chart period labels", () => {
  it("shortens semestral labels so axis ticks do not collide", () => {
    expect(shortChartPeriodLabel("AY 2024-2025 / Second Semester")).toBe("24–25 2nd");
    expect(shortChartPeriodLabel("AY 2025-2026 / First Semester")).toBe("25–26 1st");
  });
});
