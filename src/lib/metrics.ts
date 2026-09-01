import { KPI_STATUS_THRESHOLDS } from "@/lib/constants";

export type AchievementStatus =
  | "Above Target"
  | "Achieved"
  | "Near Target"
  | "Below Target"
  | "Partial Period"
  | "Pending";

export function parseRatioOrPercent(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    if (Number.isNaN(raw)) return null;
    return raw;
  }
  const text = String(raw).trim();
  if (!text) return null;
  const paren = text.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (paren) {
    const numerator = Number(paren[1].replace(/,/g, ""));
    const denominator = Number(paren[2].replace(/,/g, ""));
    if (!denominator) return null;
    return numerator / denominator;
  }
  const percent = text.match(/(-?\d+(?:\.\d+)?)\s*%/);
  if (percent) return Number(percent[1]) / 100;
  const numeric = Number(text.replace(/,/g, ""));
  return Number.isNaN(numeric) ? null : numeric;
}

export function parseFraction(raw: unknown): {
  numerator: number | null;
  denominator: number | null;
} {
  if (raw === null || raw === undefined) {
    return { numerator: null, denominator: null };
  }
  const text = String(raw);
  const match = text.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
  if (!match) return { numerator: null, denominator: null };
  return {
    numerator: Number(match[1].replace(/,/g, "")),
    denominator: Number(match[2].replace(/,/g, "")),
  };
}

export function achievementRate(
  accomplishment: number | null | undefined,
  target: number | null | undefined,
): number | null {
  if (
    accomplishment === null ||
    accomplishment === undefined ||
    target === null ||
    target === undefined ||
    Number.isNaN(accomplishment) ||
    Number.isNaN(target) ||
    target === 0
  ) {
    return null;
  }
  return accomplishment / target;
}

export function classifyAchievement(options: {
  accomplishment?: number | null;
  target?: number | null;
  isPartial?: boolean;
}): AchievementStatus {
  if (options.isPartial) return "Partial Period";
  const rate = achievementRate(options.accomplishment, options.target);
  if (rate === null) return "Pending";
  if (rate >= KPI_STATUS_THRESHOLDS.aboveTarget) return "Above Target";
  if (rate >= KPI_STATUS_THRESHOLDS.achieved) return "Achieved";
  if (rate >= KPI_STATUS_THRESHOLDS.nearTarget) return "Near Target";
  return "Below Target";
}

export function meetingTarget(options: {
  accomplishment?: number | null;
  target?: number | null;
  isPartial?: boolean;
}): boolean | null {
  if (options.isPartial) return null;
  const rate = achievementRate(options.accomplishment, options.target);
  if (rate === null) return null;
  return rate >= 1;
}
