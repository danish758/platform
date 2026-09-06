'use client';

import Link from 'next/link';
import { FC, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/stats/StatusBadge';
import type { ResultSummary } from '@/lib/stats-format';

export type ExperimentRow = {
  id: string;
  key: string;
  name: string;
  status: string;
  conversionEvent: string | null;
  createdAt: string;
  result: ResultSummary;
};

type ExperimentsTableProps = { projectId: string; experiments: ExperimentRow[] };

const STATUS_TABS: { label: string; status: string | null }[] = [
  { label: 'All Experiments', status: null },
  { label: 'Running', status: 'running' },
  { label: 'Drafts', status: 'draft' },
  { label: 'Stopped', status: 'stopped' },
];

const RESULT_STYLES: Record<ResultSummary['tone'], string> = {
  win: 'bg-emerald-100 text-emerald-800',
  loss: 'bg-rose-100 text-rose-800',
  pending: 'bg-slate-100 text-slate-700',
  'no-data': 'bg-slate-100 text-slate-500',
};

export const ExperimentsTable: FC<ExperimentsTableProps> = ({ projectId, experiments }) => {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const experiment of experiments) {
      counts[experiment.status] = (counts[experiment.status] ?? 0) + 1;
    }
    return counts;
  }, [experiments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return experiments.filter((experiment) => {
      if (activeStatus && experiment.status !== activeStatus) return false;
      if (!query) return true;
      return experiment.name.toLowerCase().includes(query) || experiment.key.toLowerCase().includes(query);
    });
  }, [experiments, activeStatus, search]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Experiments</h1>
        <Link
          href={`/projects/${projectId}/experiments/new`}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
        >
          New experiment
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-6 border-b border-slate-200">
        {STATUS_TABS.map(({ label, status }) => {
          const count = status ? (countByStatus[status] ?? 0) : experiments.length;
          const isActive = activeStatus === status;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium ${
                isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{count}</span>
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="mt-4 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Experiment</th>
              <th className="px-4 py-3 font-medium">Conversion event</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {experiments.length === 0 ? 'No experiments yet.' : 'No experiments match.'}
                </td>
              </tr>
            )}
            {filtered.map((experiment) => (
              <tr key={experiment.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${projectId}/experiments/${experiment.key}`}
                    className="font-medium hover:underline"
                  >
                    {experiment.name}
                  </Link>
                  <div className="text-xs text-slate-400">{experiment.key}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{experiment.conversionEvent || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{experiment.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={experiment.status} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${RESULT_STYLES[experiment.result.tone]}`}
                  >
                    {experiment.result.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
