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

export function DeleteExperimentButton({
  projectId,
  experimentKey,
  open,
  onOpenChange,
}: {
  projectId: string;
  experimentKey: string;
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
      { method: 'DELETE' },
      'Failed to delete experiment'
    );
    if (!body) return;

    onOpenChange(false);
    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{experimentKey}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Historical exposure/conversion data is kept, but this experiment&apos;s configuration is gone. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? 'Deleting…' : 'Delete experiment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
