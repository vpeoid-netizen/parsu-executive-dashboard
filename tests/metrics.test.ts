import { describe, expect, it } from "vitest";
import { achievementRate, classifyAchievement, parseFraction, parseRatioOrPercent } from "../src/lib/metrics";
import { formatPeriod, parseAcademicYearHeader } from "../src/lib/periods";

describe("percentage and achievement logic", () => {
  it("parses percentages, ratios and fractions", () => {
    expect(parseRatioOrPercent("76.13% (319/419)")).toBeCloseTo(319 / 419);
    expect(parseRatioOrPercent(0.54)).toBeCloseTo(0.54);
    expect(parseFraction("74.97% (719/959)")).toEqual({ numerator: 719, denominator: 959 });
  });

  it("does not compute achievement against missing or zero targets", () => {
    expect(achievementRate(10, 0)).toBeNull();
    expect(achievementRate(null, 5)).toBeNull();
    expect(achievementRate(12, 10)).toBeCloseTo(1.2);
  });

  it("marks partial-year data separately from below-target", () => {
    expect(
      classifyAchievement({ accomplishment: 0, target: 6, isPartial: true }),
    ).toBe("Partial Period");
    expect(classifyAchievement({ accomplishment: 68, target: 63 })).toBe("Above Target");
    expect(classifyAchievement({ accomplishment: 0.4, target: 0.54 })).toBe("Below Target");
  });
});

describe("period formatting", () => {
  it("formats academic and fiscal periods", () => {
    expect(parseAcademicYearHeader("2025-2026 1st Sem")).toEqual({
      start: 2025,
      end: 2026,
      semester: 1,
    });
    expect(
      formatPeriod({
        type: "SEMESTER",
        academicYearStart: 2025,
        academicYearEnd: 2026,
        semester: 2,
      }),
    ).toBe("AY 2025–2026 / Second Semester");
    expect(
      formatPeriod({
        type: "FISCAL_YEAR",
        fiscalYear: 2026,
        isPartial: true,
        asOfDate: new Date("2026-06-30T00:00:00"),
      }),
    ).toContain("FY 2026");
  });
});
