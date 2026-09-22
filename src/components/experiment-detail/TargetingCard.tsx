'use client';

import type { TargetingOperator, TargetingRule } from '@cro-engine/assignment-engine';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TargetingRulesEditor } from '@/components/experiment-detail/TargetingRulesEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApiRequest } from '@/hooks/useApiRequest';
import { coerceTargetingRow, newId, type ContextKeySummary, type TargetingRow } from '@/lib/experiment-form';
import { OPERATOR_LABELS } from '@/lib/targeting-labels';

function formatRuleValue(value: TargetingRule['value']): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function toRows(rules: TargetingRule[]): TargetingRow[] {
  return rules.map((rule) => ({
    id: newId(),
    attribute: rule.attribute,
    operator: rule.operator,
    value: Array.isArray(rule.value) ? rule.value.map(String) : [String(rule.value)],
  }));
}

export function TargetingCard({
  projectId,
  experimentKey,
  targeting,
  contextKeys,
  labelByAttribute,
}: {
  projectId: string;
  experimentKey: string;
  targeting: TargetingRule[];
  contextKeys: ContextKeySummary[];
  labelByAttribute: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<TargetingRow[]>(() => toRows(targeting));
  const { run, pending, error } = useApiRequest();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setRows(toRows(targeting));
  }

  async function handleSave() {
    const body = await run(
      `/api/projects/${projectId}/experiments/${experimentKey}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targeting: rows.map(coerceTargetingRow) }),
      },
      'Failed to save targeting'
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
            <p className="mb-1 text-sm font-semibold">Targeting</p>
            <p className="mb-4 text-xs text-muted-foreground">Who is eligible to see this experiment.</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Edit targeting">
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
                <DialogTitle className="text-2xl">Edit targeting</DialogTitle>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto px-10 py-6">
                <TargetingRulesEditor rows={rows} onChange={setRows} contextKeys={contextKeys} />

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="lg">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" size="lg" onClick={handleSave} disabled={pending}>
                  {pending ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border bg-secondary/60 p-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Targeting</span>{' '}
            {targeting.length === 0 ? (
              <em className="not-italic font-semibold">Everyone</em>
            ) : (
              <span className="font-semibold">
                {targeting.length} rule{targeting.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {targeting.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {targeting.map((rule, index) => (
                <li key={`${rule.attribute}-${index}`} className="font-mono text-xs">
                  {labelByAttribute[rule.attribute] ?? rule.attribute}{' '}
                  <span className="text-primary">{OPERATOR_LABELS[rule.operator as TargetingOperator]}</span>{' '}
                  {formatRuleValue(rule.value)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
