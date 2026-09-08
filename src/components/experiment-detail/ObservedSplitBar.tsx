import { FC } from 'react';
import { seriesColor } from '@/lib/series-colors';

type Variant = { key: string; label: string };

type ObservedSplitBarProps = { variants: Variant[]; observedVisitors: Record<string, number>; isMismatched: boolean };

export const ObservedSplitBar: FC<ObservedSplitBarProps> = ({ variants, observedVisitors, isMismatched }) => {
  const total = variants.reduce((sum, variant) => sum + (observedVisitors[variant.key] ?? 0), 0);
  const percentages = variants.map((variant) =>
    total === 0 ? 0 : Math.round(((observedVisitors[variant.key] ?? 0) / total) * 100)
  );

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{variants.map((variant) => variant.label).join(' vs. ')}</span>
        <span className={`font-mono tabular-nums ${isMismatched ? 'text-destructive' : 'text-foreground'}`}>
          {percentages.join(' / ')}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
        {variants.map((variant, index) => (
          <div
            key={variant.key}
            style={{
              width: `${percentages[index]}%`,
              backgroundColor: seriesColor(index),
            }}
          />
        ))}
      </div>
    </div>
  );
};
