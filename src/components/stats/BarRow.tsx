import { FC } from 'react';
import { pct } from '@/lib/stats-format';

type BarRowProps = { label: string; rate: number; max: number };

export const BarRow: FC<BarRowProps> = ({ label, rate, max }) => {
  const widthPct = Math.max(2, (rate / max) * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="w-20 shrink-0 truncate text-slate-500">{label}</div>
      <div className="h-3 flex-1 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-slate-900" style={{ width: `${widthPct}%` }} />
      </div>
      <div className="w-16 shrink-0 text-right tabular-nums text-slate-600">{pct(rate)}</div>
    </div>
  );
};
