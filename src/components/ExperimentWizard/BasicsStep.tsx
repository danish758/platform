'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ExperimentFormValues } from './types';
import { slugify } from './utils';

export function BasicsStep({ mode }: { mode: 'create' | 'edit' }) {
  const { register, watch, setValue } = useFormContext<ExperimentFormValues>();
  const keyEdited = watch('keyEdited');

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          {...register('name', {
            onChange: (e) => {
              if (!keyEdited) setValue('key', slugify(e.target.value));
            },
          })}
          placeholder="e.g. Homepage CTA copy"
        />
      </div>
      <div>
        <Label>Key</Label>
        <Input
          {...register('key', { onChange: () => setValue('keyEdited', true) })}
          disabled={mode === 'edit'}
          className="font-mono disabled:bg-secondary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Used by the SDK to look up this experiment. Lowercase, hyphens only.
        </p>
      </div>
      <div>
        <Label>Description (optional)</Label>
        <textarea
          {...register('description')}
          className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={2}
        />
      </div>
      <div>
        <Label>Conversion event (optional)</Label>
        <Input {...register('conversionEvent')} className="font-mono" placeholder="e.g. purchase_completed" />
        <p className="mt-1 text-xs text-muted-foreground">
          The event name your app sends via <code>client.trackConversion()</code> for this
          experiment&apos;s goal. Leave blank to only track visitor counts.
        </p>
      </div>
      <div>
        <Label>Status</Label>
        <select
          {...register('status')}
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="draft">draft — not yet live</option>
          <option value="running">running — live traffic is bucketed</option>
          <option value="stopped">stopped — no longer bucketing</option>
        </select>
      </div>
    </div>
  );
}
