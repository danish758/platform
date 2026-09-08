import { FC } from 'react';
import type { SignificanceResult } from '@cro-engine/stats-engine';
import { verdictFor } from '@/lib/stats-format';
import { cn } from '@/lib/utils';

const DOT_CLASS: Record<'win' | 'loss' | 'pending', string> = {
  win: 'bg-success',
  loss: 'bg-destructive',
  pending: 'bg-neutral',
};

export const VERDICT_LABEL_CLASS: Record<'win' | 'loss' | 'pending', string> = {
  win: 'text-success',
  loss: 'text-destructive',
  pending: 'text-foreground',
};

type VerdictBadgeProps = { result: SignificanceResult; baseline: SignificanceResult };

export const VerdictBadge: FC<VerdictBadgeProps> = ({ result, baseline }) => {
  const verdict = verdictFor(result, baseline);
  return (
    <div className="flex max-w-[220px] items-start gap-1.5">
      <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASS[verdict.tone])} />
      <div className="leading-snug">
        <span className={cn('font-semibold', VERDICT_LABEL_CLASS[verdict.tone])}>{verdict.label}</span>
        {verdict.detail && <span className="block text-xs text-muted-foreground">{verdict.detail}</span>}
      </div>
    </div>
  );
};
