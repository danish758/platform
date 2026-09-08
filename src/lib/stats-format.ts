import { minimumSampleSize, type SignificanceResult } from '@cro-engine/stats-engine';
import type { ExperimentAnalysis } from './stats';

export type Verdict = { label: string; detail?: string; tone: 'win' | 'loss' | 'pending' };

export function verdictFor(result: SignificanceResult, baseline: SignificanceResult): Verdict {
  if (result.pValue !== null && result.isSignificant) {
    if ((result.relativeLift ?? 0) > 0) return { label: 'Significant win', tone: 'win' };
    return { label: 'Significant loss', tone: 'loss' };
  }

  const mde = result.relativeLift && result.relativeLift !== 0 ? Math.abs(result.relativeLift) : 0.1;
  if (baseline.conversionRate > 0) {
    const neededPerVariant = minimumSampleSize(baseline.conversionRate, mde);
    return {
      label: 'Not significant',
      detail: `need ~${neededPerVariant.toLocaleString()} visitors/variant`,
      tone: 'pending',
    };
  }
  return { label: 'Not significant', detail: 'need more data', tone: 'pending' };
}

export function pct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * True when the normal approximation behind the reported confidence interval
 * isn't trustworthy yet — the standard rule of thumb for it (and for the
 * z-test itself) is at least ~5 expected successes AND ~5 expected failures.
 * Below that, the interval can look far wider or narrower than the data
 * actually supports, so callers should flag it rather than show it at face
 * value.
 */
export function isLowConfidenceSample(visitors: number, conversionRate: number): boolean {
  if (visitors === 0) return true;
  return visitors * conversionRate < 5 || visitors * (1 - conversionRate) < 5;
}

export type ResultSummary = { label: string; tone: 'win' | 'loss' | 'pending' | 'no-data' };

/** Whichever non-baseline result has the largest absolute lift — used both
 * for the list-view summary badge and the page-level sample-progress stat,
 * so the two never imply a different "leading" variant. */
function mostExtremeResult(results: SignificanceResult[], baselineKey: string): SignificanceResult | null {
  const others = results.filter((result) => result.variantKey !== baselineKey);
  if (others.length === 0) return null;
  return others.reduce((best, result) =>
    Math.abs(result.relativeLift ?? 0) > Math.abs(best.relativeLift ?? 0) ? result : best
  );
}

/**
 * Condenses a full experiment analysis into one badge for list views (the
 * experiments table doesn't have room for a per-variant breakdown). Picks
 * whichever non-baseline variant has the largest absolute lift and reuses
 * verdictFor's significance check on just that one.
 */
export function summarizeResult(analysis: ExperimentAnalysis | null, baselineKey: string | undefined): ResultSummary {
  if (!analysis || !baselineKey) return { label: 'No data', tone: 'no-data' };

  const baseline = analysis.results.find((result) => result.variantKey === baselineKey);
  const totalVisitors = Object.values(analysis.statsByVariant).reduce((sum, variant) => sum + variant.visitors, 0);
  if (!baseline || totalVisitors === 0) return { label: 'No data', tone: 'no-data' };

  const mostExtreme = mostExtremeResult(analysis.results, baselineKey);
  if (!mostExtreme) return { label: 'Collecting data', tone: 'pending' };

  const verdict = verdictFor(mostExtreme, baseline);
  if (verdict.tone === 'pending') return { label: 'Collecting data', tone: 'pending' };
  return { label: verdict.tone === 'win' ? 'Winning' : 'Losing', tone: verdict.tone };
}

export type SampleProgress = { totalVisitors: number; visitorsNeeded: number; percent: number };

/**
 * How far this experiment is toward the sample size it needs, expressed as
 * one page-level percentage. Uses the same "biggest lift so far, or a 10%
 * relative default" MDE assumption as verdictFor/summarizeResult, so this
 * number and the per-row verdict text never disagree about what effect size
 * is being chased.
 */
export function sampleProgress(
  analysis: ExperimentAnalysis | null,
  baselineKey: string | undefined
): SampleProgress | null {
  if (!analysis || !baselineKey) return null;
  const baseline = analysis.results.find((result) => result.variantKey === baselineKey);
  if (!baseline || baseline.conversionRate <= 0) return null;

  const mostExtreme = mostExtremeResult(analysis.results, baselineKey);
  if (!mostExtreme) return null;

  const mde = mostExtreme.relativeLift && mostExtreme.relativeLift !== 0 ? Math.abs(mostExtreme.relativeLift) : 0.1;
  const neededPerVariant = minimumSampleSize(baseline.conversionRate, mde);
  const visitorsNeeded = neededPerVariant * analysis.results.length;
  const totalVisitors = Object.values(analysis.statsByVariant).reduce((sum, variant) => sum + variant.visitors, 0);

  return { totalVisitors, visitorsNeeded, percent: Math.min(100, Math.round((totalVisitors / visitorsNeeded) * 100)) };
}
