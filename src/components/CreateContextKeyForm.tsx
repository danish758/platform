'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiRequest } from '@/hooks/useApiRequest';

export function CreateContextKeyForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'string' | 'number'>('string');
  const { run, pending, error } = useApiRequest();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const body = await run(
      `/api/projects/${projectId}/context-keys`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, label, type }) },
      'Failed to create context key'
    );
    if (!body) return;

    setKey('');
    setLabel('');
    setType('string');
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">New context key</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
          <DialogTitle className="text-2xl">New context key</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
            <div>
              <Label>Key</Label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. page"
                autoFocus
                className="mt-2 font-mono"
              />
            </div>
            <div>
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Page path"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as 'string' | 'number')}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">string</SelectItem>
                  <SelectItem value="number">number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
            <Button type="submit" size="lg" disabled={!key || !label.trim()} loading={pending}>
              Create context key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
