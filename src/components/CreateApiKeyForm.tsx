'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiRequest } from '@/hooks/useApiRequest';

export function CreateApiKeyForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const { run, pending, error } = useApiRequest();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const body = await run<{ key: string }>(
      `/api/projects/${projectId}/api-keys`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) },
      'Failed to create API key'
    );
    if (!body) return;

    setCreatedKey(body.key);
    setLabel('');
    router.refresh();
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setCreatedKey(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">New API key</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New API key</DialogTitle>
        </DialogHeader>

        {createdKey ? (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-4">
            <p className="text-sm font-medium text-warning">Copy this key now — it won&apos;t be shown again.</p>
            <code className="mt-2 block break-all rounded bg-card px-3 py-2 text-sm">{createdKey}</code>
            <Button type="button" className="mt-3" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Label (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. production" autoFocus />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? 'Creating…' : 'Create API key'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
