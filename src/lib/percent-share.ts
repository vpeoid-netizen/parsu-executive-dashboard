/** Largest-remainder percents so displayed slices add to exactly 100. */
export function sharesThatSumTo100(weights: number[], digits = 1): number[] {
  const total = weights.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
  if (total <= 0) return weights.map(() => 0);
  const factor = 10 ** digits;
  const scaled = weights.map((value) => ((Number.isFinite(value) ? value : 0) / total) * 100 * factor);
  const floors = scaled.map((value) => Math.floor(value + 1e-9));
  let leftover = Math.round(100 * factor) - floors.reduce((sum, value) => sum + value, 0);
  const order = scaled
    .map((value, index) => ({ index, frac: value - floors[index] }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  const result = [...floors];
  let step = 0;
  while (leftover > 0 && order.length) {
    result[order[step % order.length].index] += 1;
    leftover -= 1;
    step += 1;
  }
  return result.map((value) => value / factor);
}

export function formatShareLabel(sharePct: number | null | undefined, digits = 1): string {
  if (sharePct === null || sharePct === undefined || Number.isNaN(sharePct)) return "";
  return `${sharePct.toFixed(digits)}%`;
}
