import type { VariantProps } from 'class-variance-authority';
import { FC } from 'react';
import type { SignificanceResult } from '@cro-engine/stats-engine';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { verdictFor } from '@/lib/stats-format';

const VERDICT_VARIANTS: Record<'win' | 'loss' | 'pending', VariantProps<typeof badgeVariants>['variant']> = {
  win: 'success',
  loss: 'danger',
  pending: 'neutral',
};

type VerdictBadgeProps = { result: SignificanceResult; baseline: SignificanceResult };

export const VerdictBadge: FC<VerdictBadgeProps> = ({ result, baseline }) => {
  const verdict = verdictFor(result, baseline);
  return <Badge variant={VERDICT_VARIANTS[verdict.tone]}>{verdict.label}</Badge>;
};
