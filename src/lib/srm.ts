import { normalCdf } from '@cro-engine/stats-engine';

export type SrmCheckResult = {
  chiSquare: number;
  pValue: number;
  degreesOfFreedom: number;
  isMismatched: boolean;
  observed: Record<string, number>;
  expected: Record<string, number>;
  totalVisitors: number;
};

const SRM_ALPHA = 0.05;

/**
 * Sample ratio mismatch check: a chi-square goodness-of-fit test comparing
 * observed visitor counts per variant against what the configured weights
 * predict. A significant mismatch usually means broken assignment or
 * exposure logging for one variant, not a real experiment effect — distinct
 * from the conversion-rate z-test in @cro-engine/stats-engine, which compares
 * outcomes, not traffic distribution.
 *
 * Returns null when there isn't enough to test (fewer than two weighted
 * variants, or no visitors yet at all).
 */
export function checkSampleRatioMismatch(
  variants: { key: string; weight: number }[],
  observedVisitors: Record<string, number>
): SrmCheckResult | null {
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
  const totalVisitors = variants.reduce((sum, variant) => sum + (observedVisitors[variant.key] ?? 0), 0);
  if (variants.length < 2 || totalWeight <= 0 || totalVisitors === 0) return null;

  const observed: Record<string, number> = {};
  const expected: Record<string, number> = {};
  let chiSquare = 0;
  for (const variant of variants) {
    const obs = observedVisitors[variant.key] ?? 0;
    const exp = (variant.weight / totalWeight) * totalVisitors;
    observed[variant.key] = obs;
    expected[variant.key] = exp;
    if (exp > 0) chiSquare += (obs - exp) ** 2 / exp;
  }

  const degreesOfFreedom = variants.length - 1;
  const pValue = chiSquarePValue(chiSquare, degreesOfFreedom);

  return { chiSquare, pValue, degreesOfFreedom, isMismatched: pValue < SRM_ALPHA, observed, expected, totalVisitors };
}

/**
 * P(chi-square(df) >= chiSquare). df=1 is exact (chi-square(1) is a squared
 * standard normal, so this is just the two-tailed normal p-value of
 * sqrt(chiSquare) — the common case, since most experiments here have two
 * variants). df>1 uses the Wilson-Hilferty transform (chi-square -> approx.
 * normal), staying dependency-free like stats-engine itself rather than
 * implementing a full chi-square CDF for a case this app rarely hits.
 */
function chiSquarePValue(chiSquare: number, degreesOfFreedom: number): number {
  if (degreesOfFreedom <= 0) return 1;
  if (degreesOfFreedom === 1) {
    return clamp01(2 * (1 - normalCdf(Math.sqrt(chiSquare))));
  }
  const term = 2 / (9 * degreesOfFreedom);
  const z = (Math.pow(chiSquare / degreesOfFreedom, 1 / 3) - (1 - term)) / Math.sqrt(term);
  return clamp01(1 - normalCdf(z));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
