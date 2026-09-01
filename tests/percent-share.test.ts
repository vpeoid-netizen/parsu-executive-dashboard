import { describe, expect, it } from "vitest";
import { formatShareLabel, sharesThatSumTo100 } from "../src/lib/percent-share";

describe("percentage shares", () => {
  it("allocates one-decimal percents that sum to 100", () => {
    const shares = sharesThatSumTo100([28.547, 40.123, 31.33]);
    expect(shares.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 8);
    expect(shares.every((value) => Number.isInteger(Math.round(value * 10)))).toBe(true);
  });

  it("labels a 0–100 share without multiplying by 100 again", () => {
    expect(formatShareLabel(28.547)).toBe("28.5%");
    expect(formatShareLabel(1)).toBe("1.0%");
  });
});
