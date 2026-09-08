import { Fragment, type FC } from 'react';
import type { SignificanceResult, VariantStats } from '@cro-engine/stats-engine';
import { VERDICT_LABEL_CLASS } from '@/components/stats/VerdictBadge';
import { seriesColor } from '@/lib/series-colors';
import { isLowConfidenceSample, pct, verdictFor } from '@/lib/stats-format';
import { cn } from '@/lib/utils';

type VariantResultsChartProps = {
  results: SignificanceResult[];
  statsByVariant: Record<string, VariantStats>;
  labelByKey: Record<string, string>;
  baselineKey: string | undefined;
};

const NICE_DOMAIN_CAPS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100];

/** Smallest "nice" round percentage that comfortably fits every variant's
 * confidence interval, so the chart's scale isn't dictated by one outlier
 * decimal. */
function domainCapPercent(results: SignificanceResult[]): number {
  const maxUpper = Math.max(...results.map((result) => result.confidenceIntervalUpper), 0.01);
  const target = maxUpper * 100 * 1.05;
  return NICE_DOMAIN_CAPS.find((cap) => cap >= target) ?? 100;
}

export const VariantResultsChart: FC<VariantResultsChartProps> = ({
  results,
  statsByVariant,
  labelByKey,
  baselineKey,
}) => {
  const baseline = results.find((result) => result.variantKey === baselineKey);
  const domainCap = domainCapPercent(results);
  const toX = (fraction: number) => (fraction * 100 * 100) / domainCap;
  const baselineX = baseline ? toX(baseline.conversionRate) : null;
  const anyLowSample = results.some((result) =>
    isLowConfidenceSample(statsByVariant[result.variantKey]?.visitors ?? 0, result.conversionRate)
  );

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: '168px 1fr 130px', rowGap: '20px' }}>
        {baselineX !== null && (
          <div className="relative" style={{ gridColumn: 2, gridRow: `1 / ${results.length + 1}` }}>
            <div
              className="absolute -top-1.5 -bottom-1.5 border-l border-dashed border-border"
              style={{ left: `${baselineX}%` }}
            />
          </div>
        )}

        {results.map((result, rowIndex) => {
          const { visitors = 0 } = statsByVariant[result.variantKey] || {};
          const lowSample = isLowConfidenceSample(visitors, result.conversionRate);
          const isBaseline = result.variantKey === baselineKey;
          const color = seriesColor(rowIndex);
          const rate = toX(result.conversionRate);
          const ciLow = toX(result.confidenceIntervalLower);
          const ciHigh = toX(result.confidenceIntervalUpper);
          const row = rowIndex + 1;
          const verdict = !isBaseline && baseline ? verdictFor(result, baseline) : null;

          return (
            <Fragment key={result.variantKey}>
              <div className="flex items-center gap-2 text-sm" style={{ gridRow: row }}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span>
                  {labelByKey[result.variantKey] ?? result.variantKey}
                  <span className="block text-[11px] text-muted-foreground">
                    {isBaseline ? 'baseline · ' : ''}
                    {`n=${visitors}`}
                    {lowSample ? ' · low sample' : ''}
                  </span>
                </span>
              </div>

              <div className="relative h-5 self-center" style={{ gridColumn: 2, gridRow: row }}>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border/60" />
                <div
                  className="absolute top-1/2 h-0 -translate-y-1/2"
                  style={{
                    left: `${ciLow}%`,
                    width: `${Math.max(ciHigh - ciLow, 0)}%`,
                    borderTop: `2px ${lowSample ? 'dashed' : 'solid'} ${color}`,
                    opacity: lowSample ? 0.55 : 1,
                  }}
                />
                <span
                  className="absolute top-1/2 h-2.5 w-[1.5px] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${ciLow}%`, background: color, opacity: lowSample ? 0.55 : 1 }}
                />
                <span
                  className="absolute top-1/2 h-2.5 w-[1.5px] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${ciHigh}%`, background: color, opacity: lowSample ? 0.55 : 1 }}
                />
                <span
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                  style={{ left: `${rate}%`, background: color }}
                />
              </div>

              <div className="self-center text-right" style={{ gridRow: row }}>
                <span className="block font-mono text-sm font-bold tabular-nums">{pct(result.conversionRate)}</span>
                <span className={cn('text-[11px]', isBaseline ? 'text-muted-foreground' : verdict && VERDICT_LABEL_CLASS[verdict.tone])}>
                  {isBaseline ? 'baseline' : verdict?.label.toLowerCase()}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="mt-1 grid text-[10.5px] text-muted-foreground" style={{ gridTemplateColumns: '168px 1fr 130px' }}>
        <div />
        <div className="flex justify-between">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <span key={fraction}>{Math.round(domainCap * fraction)}%</span>
          ))}
        </div>
        <div />
      </div>

      {anyLowSample && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Dashed, lighter intervals mean the sample is still too small for the confidence interval to be reliable —
          treat those as &quot;too early to tell,&quot; not as a precise range.
        </p>
      )}
    </div>
  );
};
