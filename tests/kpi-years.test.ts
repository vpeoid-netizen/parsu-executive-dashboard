import { describe, expect, it } from "vitest";
import { awardFiscalYear, enrollmentPeriodFiscalYear } from "../src/lib/kpi-years";

describe("executive KPI year mapping", () => {
  it("maps second-semester enrollment to the following calendar/fiscal year", () => {
    expect(enrollmentPeriodFiscalYear({ academicYearStart: 2025, semester: 2 })).toBe(2026);
    expect(enrollmentPeriodFiscalYear({ academicYearStart: 2024, semester: 2 })).toBe(2025);
    expect(enrollmentPeriodFiscalYear({ academicYearStart: 2025, semester: 1 })).toBe(2025);
  });

  it("reads award years from dates or raw text without inventing a year", () => {
    expect(awardFiscalYear({ occurredOn: new Date("2026-05-04") })).toBe(2026);
    expect(awardFiscalYear({ occurredOn: null, occurredRaw: "November 6, 2025 / Legaspi City" })).toBe(2025);
    expect(awardFiscalYear({ occurredOn: new Date("2005-01-01"), occurredRaw: null })).toBeNull();
  });
});
