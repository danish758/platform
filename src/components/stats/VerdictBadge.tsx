import { FC } from 'react';
import type { SignificanceResult } from '@cro-engine/stats-engine';
import { verdictFor } from '@/lib/stats-format';

const VERDICT_STYLES: Record<'win' | 'loss' | 'pending', string> = {
  win: 'bg-emerald-100 text-emerald-800',
  loss: 'bg-rose-100 text-rose-800',
  pending: 'bg-slate-100 text-slate-700',
};

type VerdictBadgeProps = { result: SignificanceResult; baseline: SignificanceResult };

export const VerdictBadge: FC<VerdictBadgeProps> = ({ result, baseline }) => {
  const verdict = verdictFor(result, baseline);
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${VERDICT_STYLES[verdict.tone]}`}>
      {verdict.label}
    </span>
  );
};
