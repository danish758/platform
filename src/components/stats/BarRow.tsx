import { FC } from 'react';
import { pct } from '@/lib/stats-format';

type BarRowProps = { label: string; rate: number; max: number };

export const BarRow: FC<BarRowProps> = ({ label, rate, max }) => {
  const widthPct = Math.max(2, (rate / max) * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="w-20 shrink-0 truncate text-muted-foreground">{label}</div>
      <div className="h-3 flex-1 rounded-full bg-secondary">
        <div className="h-3 rounded-full bg-primary" style={{ width: `${widthPct}%` }} />
      </div>
      <div className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">{pct(rate)}</div>
    </div>
  );
};
