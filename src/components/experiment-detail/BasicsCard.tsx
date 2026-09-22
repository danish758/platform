'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiRequest } from '@/hooks/useApiRequest';

export function BasicsCard({
  projectId,
  experimentKey,
  name,
  description,
  conversionEvent,
}: {
  projectId: string;
  experimentKey: string;
  name: string;
  description: string;
  conversionEvent: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [descriptionDraft, setDescriptionDraft] = useState(description);
  const [conversionEventDraft, setConversionEventDraft] = useState(conversionEvent);
  const { run, pending, error } = useApiRequest();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Re-seed from the current server values every time the dialog opens —
      // Radix doesn't unmount on close, so without this a discarded edit
      // from a previous open would still be sitting in local state.
      setNameDraft(name);
      setDescriptionDraft(description);
      setConversionEventDraft(conversionEvent);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = await run(
      `/api/projects/${projectId}/experiments/${experimentKey}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameDraft, description: descriptionDraft, conversionEvent: conversionEventDraft }),
      },
      'Failed to save changes'
    );
    if (!body) return;
    setOpen(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold">Basics</p>
            <p className="mb-4 text-xs text-muted-foreground">Name, description, and how conversions are tracked.</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Edit basics">
                <Pencil />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0"
              showCloseButton={false}
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
                <DialogTitle className="text-2xl">Edit basics</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
                  <div>
                    <Label className="text-base">Name</Label>
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      autoFocus
                      className="mt-2 h-12 text-base md:text-base"
                    />
                  </div>
                  <div>
                    <Label className="text-base">Description (optional)</Label>
                    <textarea
                      value={descriptionDraft}
                      onChange={(e) => setDescriptionDraft(e.target.value)}
                      className="mt-2 w-full rounded-md border border-input bg-input-background px-3 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-base">Conversion event (optional)</Label>
                    <Input
                      value={conversionEventDraft}
                      onChange={(e) => setConversionEventDraft(e.target.value)}
                      className="mt-2 h-12 font-mono text-base md:text-base"
                      placeholder="e.g. purchase_completed"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      The event name your app sends via <code>client.trackConversion()</code> for this
                      experiment&apos;s goal. Leave blank to only track visitor counts.
                    </p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" size="lg">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" size="lg" disabled={pending || !nameDraft.trim()}>
                    {pending ? 'Saving…' : 'Save changes'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description || 'No description'}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Conversion event:{' '}
          <span className="font-mono text-foreground">{conversionEvent || 'none (visitor counts only)'}</span>
        </p>
      </CardContent>
    </Card>
  );
}
