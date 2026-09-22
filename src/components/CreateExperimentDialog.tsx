'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiRequest } from '@/hooks/useApiRequest';
import { slugify } from '@/lib/experiment-form';

export function CreateExperimentDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const { run, pending, error } = useApiRequest();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName('');
      setKey('');
      setKeyEdited(false);
      setDescription('');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = await run<{ experiment: { key: string } }>(
      `/api/projects/${projectId}/experiments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          name,
          description,
          status: 'draft',
          conversionEvent: '',
          variants: [
            { key: 'control', weight: 50, label: 'Control' },
            { key: 'variant', weight: 50, label: 'Variant' },
          ],
          targeting: [],
        }),
      },
      'Failed to create experiment'
    );
    if (!body) return;

    handleOpenChange(false);
    router.push(`/projects/${projectId}/experiments/${key}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">New experiment</Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
          <DialogTitle className="text-2xl">New experiment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
            <div>
              <Label className="text-base">Name</Label>
              <Input
                value={name}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setName(nextName);
                  if (!keyEdited) setKey(slugify(nextName));
                }}
                placeholder="e.g. Homepage CTA copy"
                autoFocus
                className="mt-2 h-12 text-base md:text-base"
              />
            </div>
            <div>
              <Label className="text-base">Key</Label>
              <Input
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setKeyEdited(true);
                }}
                className="mt-2 h-12 font-mono text-base md:text-base"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Used by the SDK to look up this experiment. Lowercase, hyphens only.
              </p>
            </div>
            <div>
              <Label className="text-base">Description (optional)</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-input-background px-3 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" disabled={pending || !name.trim() || !key.trim()}>
              {pending ? 'Creating…' : 'Create experiment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
