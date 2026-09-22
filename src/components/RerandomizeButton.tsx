'use client';

import { useRouter } from 'next/navigation';
import { type MouseEvent } from 'react';
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
import { useApiRequest } from '@/hooks/useApiRequest';

export function RerandomizeButton({
  projectId,
  experimentKey,
  currentSeed,
  open,
  onOpenChange,
}: {
  projectId: string;
  experimentKey: string;
  currentSeed: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  async function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    // Radix closes the dialog on any Action click by default — prevent that
    // so the dialog stays open (showing pending/error state) until the
    // request actually resolves.
    event.preventDefault();
    if (pending) return;

    const body = await run(
      `/api/projects/${projectId}/experiments/${experimentKey}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed: currentSeed + 1 }) },
      'Failed to re-randomize experiment'
    );
    if (!body) return;

    onOpenChange(false);
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Re-randomize this experiment?</AlertDialogTitle>
          <AlertDialogDescription>
            Every user&apos;s sticky assignment will be recomputed. Anyone already exposed may see a different
            variant next time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleConfirm}>
            {pending ? 'Re-randomizing…' : 'Force re-randomize'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
