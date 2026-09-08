import type { ExperimentStatus } from '@cro-engine/assignment-engine';
import type { FC } from 'react';
import { STATUS_DOT_CLASS } from '@/components/stats/StatusBadge';
import { cn } from '@/lib/utils';

const LABEL_CLASS: Record<ExperimentStatus, string> = {
  running: 'text-success',
  draft: 'text-warning',
  stopped: 'text-muted-foreground',
};

type StatusIndicatorProps = { status: ExperimentStatus };

/**
 * A dot + colored word, for placing status next to identifying info (the
 * experiment key, a table row) rather than as its own badge — see
 * StatusBadge for the pill version used elsewhere.
 */
export const StatusIndicator: FC<StatusIndicatorProps> = ({ status }) => (
  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium">
    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status])} />
    <span className={cn('capitalize', LABEL_CLASS[status])}>{status}</span>
  </span>
);
