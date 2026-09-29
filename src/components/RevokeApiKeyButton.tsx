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

export function RevokeApiKeyButton({
  projectId,
  keyId,
  open,
  onOpenChange,
}: {
  projectId: string;
  keyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  async function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (pending) return;

    const body = await run(`/api/projects/${projectId}/api-keys/${keyId}`, { method: 'DELETE' }, 'Failed to revoke API key');
    if (!body) return;

    onOpenChange(false);
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
          <AlertDialogDescription>
            Requests using this key will be rejected immediately. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            loading={pending}
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Revoke key
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
