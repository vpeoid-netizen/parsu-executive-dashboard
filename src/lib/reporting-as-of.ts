/** FY 2026 on this dashboard is a partial year through this date. */
export const FY2026_AS_OF_LABEL = "September 30, 2026";
export const FY2026_AS_OF_DATE = new Date("2026-09-30T00:00:00");

export function withCurrentAsOf(text: string | null | undefined): string | null {
  if (!text) return text ?? null;
  return text.replace(/June 30, 2026/g, FY2026_AS_OF_LABEL);
}
