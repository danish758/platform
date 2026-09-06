import { FC } from 'react';

const STATUS_STYLES: Record<string, string> = {
  running: 'bg-emerald-100 text-emerald-800',
  stopped: 'bg-slate-200 text-slate-700',
  draft: 'bg-amber-100 text-amber-800',
};

type StatusBadgeProps = { status: string };

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700'}`}
  >
    {status}
  </span>
);
