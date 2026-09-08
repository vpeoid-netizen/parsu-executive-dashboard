import { describe, expect, it } from "vitest";
import { contributionByRankAndYear, authorsJsonToEditorText, editorTextToAuthorsJson } from "../src/lib/research";

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

  it("round-trips author names and ranks through the admin editor text", () => {
    const json = JSON.stringify([
      { name: "Santos, A.", academicRank: "Assistant Professor", contribution: 1 },
      { name: "Cruz, B.", contribution: 1 },
    ]);
    const text = authorsJsonToEditorText(json);
    expect(text).toBe("Santos, A. (Assistant Professor); Cruz, B.");
    expect(editorTextToAuthorsJson(text)).toBe(
      JSON.stringify([
        { name: "Santos, A.", academicRank: "Assistant Professor", contribution: 1 },
        { name: "Cruz, B.", contribution: 1 },
      ]),
    );
  });
});
