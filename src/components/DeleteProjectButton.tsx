'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiRequest } from '@/hooks/useApiRequest';

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
  // Where to send the user after a successful delete. Omit to stay on the
  // current page and just refresh it (the projects list); pass a path (e.g.
  // "/projects") to navigate away, for use from a page about the project
  // being deleted.
  redirectTo?: string;
};

export function DeleteProjectButton({ projectId, projectName, redirectTo }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { run, pending, error } = useApiRequest();

  const canDelete = confirmText === projectName;

  async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    // Radix closes the dialog on any Action click by default — prevent that
    // so the dialog stays open (showing pending/error state) until the
    // request actually resolves.
    e.preventDefault();
    if (!canDelete || pending) return;

    const body = await run(`/api/projects/${projectId}`, { method: 'DELETE' }, 'Failed to delete project');
    if (!body) return;

    setOpen(false);
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
        setOpen(nextOpen);
        if (!nextOpen) setConfirmText('');
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-destructive/50 bg-transparent text-destructive hover:bg-destructive/20 hover:text-destructive"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
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
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? 'Deleting…' : 'Delete project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
