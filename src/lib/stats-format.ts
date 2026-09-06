import { minimumSampleSize, type SignificanceResult } from '@cro-engine/stats-engine';
import type { ExperimentAnalysis } from './stats';

export type Verdict = { label: string; tone: 'win' | 'loss' | 'pending' };

export function verdictFor(result: SignificanceResult, baseline: SignificanceResult): Verdict {
  if (result.pValue !== null && result.isSignificant) {
    if ((result.relativeLift ?? 0) > 0) return { label: 'Significant win', tone: 'win' };
    return { label: 'Significant loss', tone: 'loss' };
  }

  const mde = result.relativeLift && result.relativeLift !== 0 ? Math.abs(result.relativeLift) : 0.1;
  if (baseline.conversionRate > 0) {
    const neededPerVariant = minimumSampleSize(baseline.conversionRate, mde);
    return {
      label: `Not yet significant — need ~${neededPerVariant.toLocaleString()} visitors per variant to detect this effect`,
      tone: 'pending',
    };
  }
  return { label: 'Not yet significant — need more data', tone: 'pending' };
}

export function pct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export type ResultSummary = { label: string; tone: 'win' | 'loss' | 'pending' | 'no-data' };

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

  const others = analysis.results.filter((result) => result.variantKey !== baselineKey);
  if (others.length === 0) return { label: 'Collecting data', tone: 'pending' };

  const mostExtreme = others.reduce((best, result) =>
    Math.abs(result.relativeLift ?? 0) > Math.abs(best.relativeLift ?? 0) ? result : best
  );
  const verdict = verdictFor(mostExtreme, baseline);
  if (verdict.tone === 'pending') return { label: 'Collecting data', tone: 'pending' };
  return { label: verdict.tone === 'win' ? 'Winning' : 'Losing', tone: verdict.tone };
}
