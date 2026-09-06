import { FC } from 'react';
import type { SignificanceResult, VariantStats } from '@cro-engine/stats-engine';
import { BarRow } from '@/components/stats/BarRow';
import { VerdictBadge } from '@/components/stats/VerdictBadge';
import { pct } from '@/lib/stats-format';

type VariantResultsTableProps = {
  results: SignificanceResult[];
  statsByVariant: Record<string, VariantStats>;
  labelByKey: Record<string, string>;
  baselineKey: string | undefined;
};

export const VariantResultsTable: FC<VariantResultsTableProps> = ({
  results,
  statsByVariant,
  labelByKey,
  baselineKey,
}) => {
  const baseline = results.find((result) => result.variantKey === baselineKey) ?? null;
  const maxRate = Math.max(...results.map((result) => result.conversionRate), 0.0001);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4 font-medium">Variant</th>
              <th className="py-2 pr-4 font-medium">Visitors</th>
              <th className="py-2 pr-4 font-medium">Conversions</th>
              <th className="py-2 pr-4 font-medium">Conv. rate</th>
              <th className="py-2 pr-4 font-medium">Lift vs baseline</th>
              <th className="py-2 pr-4 font-medium">p-value</th>
              <th className="py-2 font-medium">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const { visitors = 0, conversions = 0 } = statsByVariant[result.variantKey] || {};
              return (
                <tr key={result.variantKey} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {labelByKey[result.variantKey] ?? result.variantKey}
                    {result.variantKey === baselineKey && (
                      <span className="ml-1.5 text-xs text-slate-400">(baseline)</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{visitors}</td>
                  <td className="py-3 pr-4 tabular-nums">{conversions}</td>
                  <td className="py-3 pr-4 tabular-nums">{pct(result.conversionRate)}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {result.relativeLift === null
                      ? '—'
                      : `${result.relativeLift >= 0 ? '+' : ''}${(result.relativeLift * 100).toFixed(1)}%`}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{result.pValue === null ? '—' : result.pValue.toFixed(4)}</td>
                  <td className="py-3">
                    {result.pValue === null || !baseline ? (
                      <span className="text-xs text-slate-400">baseline</span>
                    ) : (
                      <VerdictBadge result={result} baseline={baseline} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-2">
        {results.map((result) => (
          <BarRow
            key={result.variantKey}
            label={labelByKey[result.variantKey] ?? result.variantKey}
            rate={result.conversionRate}
            max={maxRate}
          />
        ))}
      </div>
    </>
  );
};
