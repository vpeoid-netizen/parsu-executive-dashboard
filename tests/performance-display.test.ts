import { describe, expect, it } from "vitest";
import {
  buildHistoryChart,
  displayMeasure,
  isPercentMeasure,
  partitionPerformanceYears,
  toChartNumber,
} from "../src/lib/performance-display";

describe("performance display helpers", () => {
  it("treats percentage titles as percent measures even when a count-like year exists", () => {
    expect(
      isPercentMeasure("1. Percentage of first-time licensure exam-takers that pass the licensure exams", [
        { fiscalYear: 2024, targetRaw: "54%", targetValue: 0.54, accomplishmentRaw: "76.13%", accomplishmentValue: 0.7613, isPartial: false },
      ]),
    ).toBe(true);
  });

  it("does not treat research output counts as percents", () => {
    expect(
      isPercentMeasure("1. Number of research outputs completed within the year", [
        { fiscalYear: 2024, targetRaw: "63", targetValue: 63, accomplishmentRaw: "68", accomplishmentValue: 68, isPartial: false },
        { fiscalYear: 2025, targetRaw: "63", targetValue: 63, accomplishmentRaw: "70", accomplishmentValue: 70, isPartial: false },
      ]),
    ).toBe(false);
  });

  it("scales ratio accomplishments to percentage points for charts", () => {
    expect(toChartNumber(0.7613365155131265, true)).toBe(76.13);
    expect(toChartNumber(68, false)).toBe(68);
  });

  it("prefers the published raw string when displaying a cell", () => {
    expect(displayMeasure("71.88% (23/32)", 0.71875, true)).toBe("71.88% (23/32)");
    expect(displayMeasure(null, 0.54, true)).toBe("54.00%");
    expect(displayMeasure("0.5405", 0.5405, true)).toBe("54.05%");
    expect(displayMeasure("1", 1, true)).toBe("100.00%");
  });

  it("builds a historical series with partial-year labels", () => {
    const chart = buildHistoryChart("2. Percentage of graduates (2 yrs prior) that are employed", [
      {
        fiscalYear: 2024,
        targetRaw: "64%",
        targetValue: 0.64,
        accomplishmentRaw: "74.97%",
        accomplishmentValue: 0.7497,
        isPartial: false,
      },
      {
        fiscalYear: 2026,
        targetRaw: "64.02%",
        targetValue: 0.6402,
        accomplishmentRaw: "25.99%",
        accomplishmentValue: 0.2599,
        isPartial: true,
      },
    ]);
    expect(chart.asPercent).toBe(true);
    expect(chart.points[0]).toEqual({ period: "FY 2024", Target: 64, Accomplishment: 74.97 });
    expect(chart.points[1]?.period).toBe("FY 2026*");
  });

  it("treats FY 2026 as the focus year and earlier years as historical", () => {
    const partitioned = partitionPerformanceYears([
      { fiscalYear: 2024, targetRaw: null, targetValue: 1, accomplishmentRaw: null, accomplishmentValue: 1, isPartial: false },
      { fiscalYear: 2025, targetRaw: null, targetValue: 1, accomplishmentRaw: null, accomplishmentValue: 1, isPartial: false },
      { fiscalYear: 2026, targetRaw: null, targetValue: 1, accomplishmentRaw: "66%", accomplishmentValue: 0.66, isPartial: true },
    ]);
    expect(partitioned.focusYear).toBe(2026);
    expect(partitioned.focus?.accomplishmentValue).toBe(0.66);
    expect(partitioned.historical.map((row) => row.fiscalYear)).toEqual([2025, 2024]);
  });
});
