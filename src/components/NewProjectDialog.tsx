'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FC, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiRequest } from '@/hooks/useApiRequest';

export const NewProjectDialog: FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const { run, pending, error } = useApiRequest();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const body = await run(
      '/api/projects',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) },
      'Failed to create project'
    );
    if (!body) return;

    setName('');
    setIsOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-ring/40 hover:text-foreground"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border">
            <Plus className="h-4 w-4" />
          </span>
          New project
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
          <DialogTitle className="text-2xl">New project</DialogTitle>
          <DialogDescription>Give it a name — you can add experiments and API keys after.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
            <div>
              <Label htmlFor="new-project-name">Project name</Label>
              <Input
                id="new-project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Marketing Site"
                autoFocus
                required
                className="mt-2"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
            <Button type="submit" size="lg" loading={pending}>
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
