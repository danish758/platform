'use client';

import type { ExperimentStatus } from '@cro-engine/assignment-engine';
import type { VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { FC, useMemo, useState } from 'react';
import { CreateExperimentDialog } from '@/components/CreateExperimentDialog';
import { ExperimentStatusControl } from '@/components/ExperimentStatusControl';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ResultSummary } from '@/lib/stats-format';

export type ExperimentRow = {
  id: string;
  key: string;
  name: string;
  status: ExperimentStatus;
  conversionEvent: string | null;
  createdAt: string;
  result: ResultSummary;
};

type ExperimentsTableProps = { projectId: string; experiments: ExperimentRow[] };

const STATUS_TABS: { label: string; status: ExperimentStatus | null }[] = [
  { label: 'All Experiments', status: null },
  { label: 'Running', status: 'running' },
  { label: 'Drafts', status: 'draft' },
  { label: 'Stopped', status: 'stopped' },
];

const RESULT_VARIANTS: Record<ResultSummary['tone'], VariantProps<typeof badgeVariants>['variant']> = {
  win: 'success',
  loss: 'danger',
  pending: 'neutral',
  'no-data': 'neutral',
};

export const ExperimentsTable: FC<ExperimentsTableProps> = ({ projectId, experiments }) => {
  const [activeStatus, setActiveStatus] = useState<ExperimentStatus | null>(null);
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
        <CreateExperimentDialog projectId={projectId} />
      </div>

      <div className="mt-6 flex items-center gap-6 border-b border-border">
        {STATUS_TABS.map(({ label, status }) => {
          const count = status ? (countByStatus[status] ?? 0) : experiments.length;
          const isActive = activeStatus === status;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="mt-4 max-w-sm"
      />

      <div className="mt-4">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Experiment</TableHead>
              <TableHead>Conversion event</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {experiments.length === 0 ? 'No experiments yet.' : 'No experiments match.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((experiment) => (
              <TableRow key={experiment.id}>
                <TableCell>
                  <Link
                    href={`/projects/${projectId}/experiments/${experiment.key}`}
                    className="font-medium hover:underline"
                  >
                    {experiment.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{experiment.key}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{experiment.conversionEvent || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{experiment.createdAt.slice(0, 10)}</TableCell>
                <TableCell>
                  <ExperimentStatusControl
                    variant="select"
                    projectId={projectId}
                    experimentKey={experiment.key}
                    experimentName={experiment.name}
                    status={experiment.status}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={RESULT_VARIANTS[experiment.result.tone]}>{experiment.result.label}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
