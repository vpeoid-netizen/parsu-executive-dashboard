import { describe, expect, it } from "vitest";
import { withCurrentAsOf } from "../src/lib/reporting-as-of";
import { researchCountsByYear } from "../src/lib/research-performance";

describe("research counts from university performance", () => {
  const rows = [
    {
      programMfo: "Research Program",
      title: "1. Number of research outputs completed within the year",
      fiscalYear: 2026,
      accomplishmentValue: 27,
      numerator: null,
    },
    {
      programMfo: "Research Program",
      title: "2. Percentage of research outputs published in internationally-refereed or CHED recognized journal within the year",
      fiscalYear: 2026,
      accomplishmentValue: 15 / 234,
      numerator: 15,
    },
    {
      programMfo: "Research Program",
      title: "1. Number of research outputs in the last three years utilized by the industry or by other beneficiaries",
      fiscalYear: 2026,
      accomplishmentValue: 0,
      numerator: null,
    },
    {
      programMfo: "Research Program",
      title: "1. Number of research outputs completed within the year",
      fiscalYear: 2024,
      accomplishmentValue: 68,
      numerator: null,
    },
    {
      programMfo: "Higher Education Program",
      title: "1. Percentage of first-time licensure exam-takers that pass the licensure exams",
      fiscalYear: 2026,
      accomplishmentValue: 0.6643,
      numerator: 95,
    },
  ];

  it("uses the performance accomplishment, and the publication numerator", () => {
    const counts = researchCountsByYear(rows);
    expect(counts.get(2026)).toEqual({ completed: 27, publications: 15, utilized: 0 });
    expect(counts.get(2024)?.completed).toBe(68);
    expect(counts.get(2026)?.publications).not.toBeCloseTo(15 / 234);
  });

  it("reads the publication count from the accomplishment text when the numerator is missing", () => {
    const counts = researchCountsByYear([
      {
        programMfo: "Research Program",
        title: "2. Percentage of research outputs published in internationally-refereed or CHED recognized journal within the year",
        fiscalYear: 2026,
        accomplishmentValue: 15 / 234,
        accomplishmentRaw: "6.41% (15/234)",
        numerator: null,
      },
    ]);
    expect(counts.get(2026)?.publications).toBe(15);
  });
});

describe("current as-of label", () => {
  it("replaces the previous June 30 cutoff", () => {
    expect(withCurrentAsOf("FY 2026 as of June 30, 2026")).toBe("FY 2026 as of September 30, 2026");
  });
});
