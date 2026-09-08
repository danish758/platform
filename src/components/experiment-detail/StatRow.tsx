import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Stat = { label: string; value: string; flag?: boolean };

type StatRowProps = {
  totalVisitors: number;
  sampleProgressPercent: number | null;
  dailyVisitorRate: number | null;
  diagnosticsCount: number;
};

export const StatRow: FC<StatRowProps> = ({
  totalVisitors,
  sampleProgressPercent,
  dailyVisitorRate,
  diagnosticsCount,
}) => {
  const stats: Stat[] = [
    { label: 'Visitors', value: totalVisitors.toLocaleString() },
    { label: 'Sample progress', value: sampleProgressPercent === null ? '—' : `${sampleProgressPercent}%` },
    { label: 'Daily traffic', value: dailyVisitorRate === null ? '—' : `${dailyVisitorRate.toFixed(1)}/day` },
    {
      label: 'Diagnostics',
      value: diagnosticsCount === 0 ? 'None' : `${diagnosticsCount} issue${diagnosticsCount > 1 ? 's' : ''}`,
      flag: diagnosticsCount > 0,
    },
  ];

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </span>
            <span className={cn('font-mono text-xl font-semibold tabular-nums', stat.flag && 'text-destructive')}>
              {stat.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
