'use client';

import type { ExperimentStatus } from '@cro-engine/assignment-engine';
import { Check, ChevronDown, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { STATUS_DOT_CLASS, STATUS_VARIANTS } from '@/components/stats/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { badgeVariants } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApiRequest } from '@/hooks/useApiRequest';
import { cn } from '@/lib/utils';

const NEXT_ACTION: Record<ExperimentStatus, { label: string; pendingLabel: string; next: ExperimentStatus }> = {
  draft: { label: 'Start experiment', pendingLabel: 'Starting…', next: 'running' },
  running: { label: 'Stop experiment', pendingLabel: 'Stopping…', next: 'stopped' },
  stopped: { label: 'Restart experiment', pendingLabel: 'Restarting…', next: 'running' },
};

const ALL_STATUSES: ExperimentStatus[] = ['draft', 'running', 'stopped'];

type ExperimentStatusControlProps = {
  projectId: string;
  experimentKey: string;
  experimentName: string;
  status: ExperimentStatus;
  variant: 'select' | 'action';
};

export function ExperimentStatusControl({
  projectId,
  experimentKey,
  experimentName,
  status,
  variant,
}: ExperimentStatusControlProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { run, pending, error } = useApiRequest();

  async function applyStatus(next: ExperimentStatus) {
    const body = await run(
      `/api/projects/${projectId}/experiments/${experimentKey}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) },
      'Failed to update status'
    );
    if (!body) return;
    setConfirmOpen(false);
    router.refresh();
  }

  function requestStatus(next: ExperimentStatus) {
    if (next === 'stopped' && status === 'running') {
      setConfirmOpen(true);
      return;
    }
    applyStatus(next);
  }

  async function handleConfirmStop(e: React.MouseEvent<HTMLButtonElement>) {
    // Radix closes the dialog on any Action click by default — prevent that
    // so the dialog stays open (showing pending/error state) until the
    // request actually resolves.
    e.preventDefault();
    if (pending) return;
    await applyStatus('stopped');
  }

  const confirmDialog = (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stop &quot;{experimentName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Traffic stops being bucketed immediately. Existing assignments are kept, but no new visitors
            will be included until you restart it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={handleConfirmStop}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? 'Stopping…' : 'Stop experiment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === 'select') {
    return (
      <>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={pending}
              aria-label={`Change status for ${experimentName}`}
              className={cn(
                badgeVariants({ variant: STATUS_VARIANTS[status] }),
                'group gap-2 rounded-full border border-transparent px-3 py-1.5 text-sm transition-colors',
                'hover:border-current/40 disabled:opacity-60'
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[status])} />
              {status}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform group-hover:rotate-180',
                  menuOpen && 'rotate-180'
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-40 border-border bg-popover p-1">
            {ALL_STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  requestStatus(option);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary"
              >
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT_CLASS[option])} />
                <span className="flex-1 text-left">{option}</span>
                {option === status && <Check className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        {confirmDialog}
      </>
    );
  }

  const { label, pendingLabel, next } = NEXT_ACTION[status];
  // Starting/restarting is constructive (primary, filled); stopping halts
  // traffic but isn't destructive to any data, so it gets a quieter
  // primary-tinted outline instead of the same solid fill.
  const isStopping = next === 'stopped';

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        disabled={pending}
        onClick={() => requestStatus(next)}
        variant={isStopping ? 'outline' : 'default'}
        className={
          isStopping
            ? 'border-primary/40 text-primary hover:bg-primary/10 hover:text-primary'
            : 'bg-primary/85 hover:bg-primary/95'
        }
      >
        {pending ? (
          pendingLabel
        ) : (
          <>
            {status === 'draft' && <Rocket />}
            {label}
          </>
        )}
      </Button>
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
      {confirmDialog}
    </div>
  );
}
