'use client';

import { useFormContext } from 'react-hook-form';
import { VariantAllocationSliders } from '@/components/VariantAllocationSliders';
import { equalSplit, rebalanceProportional } from '@/lib/variant-weights';
import type { ExperimentFormValues } from './types';
import { newId, slugify } from './utils';

export function VariantsStep({ liveErrors }: { liveErrors: string[] }) {
  const { register, watch, setValue } = useFormContext<ExperimentFormValues>();
  const variants = watch('variants');

  function handleWeightChange(index: number, newWeight: number) {
    const nextWeights = rebalanceProportional(variants.map((variant) => variant.weight), index, newWeight);
    setValue('variants', variants.map((variant, variantIndex) => ({ ...variant, weight: nextWeights[variantIndex] })));
  }

  function handleRemoveVariant(variantId: string) {
    const remaining = variants.filter((variant) => variant.id !== variantId);
    setValue('variants', remaining.map((variant, index) => ({ ...variant, weight: equalSplit(remaining.length)[index] })));
  }

  function handleAddVariant() {
    const nextVariants = [...variants, { id: newId(), key: '', keyEdited: false, weight: 0, label: '' }];
    setValue('variants', nextVariants.map((variant, index) => ({ ...variant, weight: equalSplit(nextVariants.length)[index] })));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Label is just for this dashboard; variant key is what the SDK actually sends.
      </p>

      <VariantAllocationSliders
        segments={variants.map((variant) => ({ id: variant.id, label: variant.label || variant.key || 'variant', weight: variant.weight }))}
        onChangeWeight={handleWeightChange}
      />

      {variants.map((variant, index) => (
        <div key={variant.id} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">Label</label>
            <input
              {...register(`variants.${index}.label`, {
                onChange: (e) => {
                  if (!variant.keyEdited) setValue(`variants.${index}.key`, slugify(e.target.value));
                },
              })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Green button"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">Variant key</label>
            <input
              {...register(`variants.${index}.key`, { onChange: () => setValue(`variants.${index}.keyEdited`, true) })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveVariant(variant.id)}
            disabled={variants.length <= 2}
            className="rounded-md px-2 py-2 text-sm text-rose-600 disabled:opacity-30"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAddVariant} className="text-sm font-medium text-slate-700 underline">
        + Add variant
      </button>

      {liveErrors.length > 0 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          {liveErrors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}
