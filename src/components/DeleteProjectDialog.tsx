'use client';

import { useRouter } from 'next/navigation';
import { useState, type FC, type MouseEvent } from 'react';
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
import { Input } from '@/components/ui/input';
import { useApiRequest } from '@/hooks/useApiRequest';

type DeleteProjectDialogProps = {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Where to send the user after a successful delete. Omit to stay on the
  // current page and just refresh it (the projects list); pass a path (e.g.
  // "/projects") to navigate away, for use from a page about the project
  // being deleted.
  redirectTo?: string;
};

export const DeleteProjectDialog: FC<DeleteProjectDialogProps> = ({
  projectId,
  projectName,
  open,
  onOpenChange,
  redirectTo,
}) => {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const { run, pending, error } = useApiRequest();

  const canDelete = confirmText === projectName;

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    // Radix closes the dialog on any Action click by default — prevent that
    // so the dialog stays open (showing pending/error state) until the
    // request actually resolves.
    event.preventDefault();
    if (!canDelete || pending) return;

    const body = await run(`/api/projects/${projectId}`, { method: 'DELETE' }, 'Failed to delete project');
    if (!body) return;

    onOpenChange(false);
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setConfirmText('');
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{projectName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes this project&apos;s experiments, API keys, context keys, and all
            recorded exposures and conversions. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <label htmlFor="confirm-project-name" className="text-sm font-medium">
            Type <span className="font-semibold">{projectName}</span> to confirm
          </label>
          <Input id="confirm-project-name" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete || pending}
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? 'Deleting…' : 'Delete project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
