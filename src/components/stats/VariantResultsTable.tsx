import { FC } from 'react';
import type { SignificanceResult, VariantStats } from '@cro-engine/stats-engine';
import { BarRow } from '@/components/stats/BarRow';
import { VerdictBadge } from '@/components/stats/VerdictBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead>Visitors</TableHead>
            <TableHead>Conversions</TableHead>
            <TableHead>Conv. rate</TableHead>
            <TableHead>Lift vs baseline</TableHead>
            <TableHead>p-value</TableHead>
            <TableHead>Verdict</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const { visitors = 0, conversions = 0 } = statsByVariant[result.variantKey] || {};
            return (
              <TableRow key={result.variantKey}>
                <TableCell className="font-medium">
                  {labelByKey[result.variantKey] ?? result.variantKey}
                  {result.variantKey === baselineKey && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(baseline)</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{visitors}</TableCell>
                <TableCell className="tabular-nums">{conversions}</TableCell>
                <TableCell className="tabular-nums">{pct(result.conversionRate)}</TableCell>
                <TableCell className="tabular-nums">
                  {result.relativeLift === null
                    ? '—'
                    : `${result.relativeLift >= 0 ? '+' : ''}${(result.relativeLift * 100).toFixed(1)}%`}
                </TableCell>
                <TableCell className="tabular-nums">
                  {result.pValue === null ? '—' : result.pValue.toFixed(4)}
                </TableCell>
                <TableCell>
                  {result.pValue === null || !baseline ? (
                    <span className="text-xs text-muted-foreground">baseline</span>
                  ) : (
                    <VerdictBadge result={result} baseline={baseline} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

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
