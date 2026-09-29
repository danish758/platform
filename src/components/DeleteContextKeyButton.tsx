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

export function DeleteContextKeyButton({
  projectId,
  keyId,
  contextKey,
  open,
  onOpenChange,
}: {
  projectId: string;
  keyId: string;
  contextKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  async function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (pending) return;

    const body = await run(
      `/api/projects/${projectId}/context-keys/${keyId}`,
      { method: 'DELETE' },
      'Failed to delete context key'
    );
    if (!body) return;

    onOpenChange(false);
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{contextKey}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            loading={pending}
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
