import type { FC } from 'react';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

const STATUS_VARIANTS: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
  running: 'success',
  stopped: 'neutral',
  draft: 'warning',
};

type StatusBadgeProps = { status: string };

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => (
  <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'}>{status}</Badge>
);
