import { describe, expect, it } from "vitest";
import { formatCellValue, formatNumber, formatThousandsInText } from "../src/lib/format";

describe("thousand separators", () => {
  it("groups counts of 1,000 and above", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(4353)).toBe("4,353");
    expect(formatNumber(12750)).toBe("12,750");
  });

  it("inserts commas into published count text and fractions", () => {
    expect(formatThousandsInText("4353")).toBe("4,353");
    expect(formatThousandsInText("99.79% (4259/4268)")).toBe("99.79% (4,259/4,268)");
    expect(formatThousandsInText("71.88% (23/32)")).toBe("71.88% (23/32)");
  });

  it("does not rewrite fiscal years", () => {
    expect(formatThousandsInText("FY 2026")).toBe("FY 2026");
    expect(formatCellValue(2026)).toBe("2026");
    expect(formatCellValue(4353)).toBe("4,353");
  });
});
