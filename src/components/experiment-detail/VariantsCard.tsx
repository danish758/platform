'use client';

import { validateConfig, type ExperimentConfig } from '@cro-engine/assignment-engine';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { VariantSplitFlow } from '@/components/experiment-detail/VariantSplitFlow';
import { VariantsEditor } from '@/components/experiment-detail/VariantsEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApiRequest } from '@/hooks/useApiRequest';
import { newId, type VariantRow } from '@/lib/experiment-form';
import { equalSplit, rebalanceProportional } from '@/lib/variant-weights';

type VariantInput = { key: string; label: string; weight: number };

function toRows(variants: VariantInput[]): VariantRow[] {
  return variants.map((variant) => ({
    id: newId(),
    key: variant.key,
    keyEdited: true,
    weight: variant.weight,
    label: variant.label,
  }));
}

export function VariantsCard({
  projectId,
  experimentKey,
  status,
  variants,
}: {
  projectId: string;
  experimentKey: string;
  status: ExperimentConfig['status'];
  variants: VariantInput[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<VariantRow[]>(() => toRows(variants));
  const { run, pending, error } = useApiRequest();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setRows(toRows(variants));
  }

  function handleChangeWeight(index: number, newWeight: number) {
    const nextWeights = rebalanceProportional(rows.map((row) => row.weight), index, newWeight);
    setRows(rows.map((row, rowIndex) => ({ ...row, weight: nextWeights[rowIndex] })));
  }

  function handleRemove(id: string) {
    const remaining = rows.filter((row) => row.id !== id);
    setRows(remaining.map((row, index) => ({ ...row, weight: equalSplit(remaining.length)[index] })));
  }

  function handleAdd() {
    const next = [...rows, { id: newId(), key: '', keyEdited: false, weight: 0, label: '' }];
    setRows(next.map((row, index) => ({ ...row, weight: equalSplit(next.length)[index] })));
  }

  const liveErrors = validateConfig({
    key: experimentKey,
    status,
    variants: rows.map((row) => ({ key: row.key, weight: row.weight })),
  });

  async function handleSave() {
    const body = await run(
      `/api/projects/${projectId}/experiments/${experimentKey}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: rows.map((row) => ({ key: row.key, weight: row.weight, label: row.label.trim() || undefined })),
        }),
      },
      'Failed to save variants'
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
            <p className="mb-1 text-sm font-semibold">Variants</p>
            <p className="mb-4 text-xs text-muted-foreground">How eligible visitors are split across variants.</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Edit variants">
                <Pencil />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="flex h-[600px] max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0"
              showCloseButton={false}
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
                <DialogTitle className="text-2xl">Edit variants</DialogTitle>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto px-10 py-6">
                <VariantsEditor
                  variants={rows}
                  onChange={setRows}
                  onChangeWeight={handleChangeWeight}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  liveErrors={liveErrors}
                />

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="lg">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" size="lg" onClick={handleSave} disabled={pending || liveErrors.length > 0}>
                  {pending ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <VariantSplitFlow
          variants={variants.map((variant) => ({ key: variant.key, label: variant.label || variant.key, weight: variant.weight }))}
        />
      </CardContent>
    </Card>
  );
}
