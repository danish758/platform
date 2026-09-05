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
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
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
          <input
            id="confirm-project-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete || pending}
            onClick={handleDelete}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {pending ? 'Deleting…' : 'Delete project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
