'use client';

import { useFormContext } from 'react-hook-form';
import type { ExperimentFormValues } from './types';
import { slugify } from './utils';

export function BasicsStep({ mode }: { mode: 'create' | 'edit' }) {
  const { register, watch, setValue } = useFormContext<ExperimentFormValues>();
  const keyEdited = watch('keyEdited');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          {...register('name', {
            onChange: (e) => {
              if (!keyEdited) setValue('key', slugify(e.target.value));
            },
          })}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g. Homepage CTA copy"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Key</label>
        <input
          {...register('key', { onChange: () => setValue('keyEdited', true) })}
          disabled={mode === 'edit'}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono disabled:bg-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500">Used by the SDK to look up this experiment. Lowercase, hyphens only.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
        <textarea {...register('description')} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Conversion event (optional)</label>
        <input
          {...register('conversionEvent')}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
          placeholder="e.g. purchase_completed"
        />
        <p className="mt-1 text-xs text-slate-500">
          The event name your app sends via <code>client.trackConversion()</code> for this
          experiment&apos;s goal. Leave blank to only track visitor counts.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Status</label>
        <select {...register('status')} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="draft">draft — not yet live</option>
          <option value="running">running — live traffic is bucketed</option>
          <option value="stopped">stopped — no longer bucketing</option>
        </select>
      </div>
    </div>
  );
}
