import { describe, expect, it } from "vitest";
import { contributionByRankAndYear } from "../src/lib/research";

describe("research contribution shares", () => {
  it("weights annual accomplishment by author contribution and academic rank", () => {
    const share = contributionByRankAndYear([
      {
        fiscalYear: 2026,
        authorsJson: JSON.stringify([
          { name: "A", academicRank: "Professor III", contribution: 0.6 },
          { name: "B", academicRank: "Instructor I", contribution: 0.4 },
        ]),
      },
      {
        fiscalYear: 2026,
        authorsJson: JSON.stringify([{ name: "C", academicRank: "Instructor III", contribution: 1 }]),
      },
    ]);
    expect(share.latestYear).toBe(2026);
    const instructor = share.table.find((row) => row.rank === "Instructor");
    const professor = share.table.find((row) => row.rank === "Professor");
    expect(instructor?.percent).toBeCloseTo(70, 5);
    expect(professor?.percent).toBeCloseTo(30, 5);
    expect(share.table.reduce((sum, row) => sum + row.percent, 0)).toBe(100);
    const stacked = share.stacked[0] as Record<string, number | string>;
    expect(stacked.Instructor).toBe(70);
    expect(stacked.Professor).toBe(30);
  });
});
