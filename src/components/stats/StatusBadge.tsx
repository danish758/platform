import type { ExperimentStatus } from '@cro-engine/assignment-engine';
import type { FC } from 'react';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

export const STATUS_VARIANTS: Record<ExperimentStatus, VariantProps<typeof badgeVariants>['variant']> = {
  running: 'success',
  stopped: 'neutral',
  draft: 'warning',
};

type StatusBadgeProps = { status: ExperimentStatus };

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => (
  <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'}>{status}</Badge>
);
