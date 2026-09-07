'use client';

import { useFormContext } from 'react-hook-form';
import { VariantAllocationSliders } from '@/components/VariantAllocationSliders';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <p className="text-sm text-muted-foreground">
        Label is just for this dashboard; variant key is what the SDK actually sends.
      </p>

      <VariantAllocationSliders
        segments={variants.map((variant) => ({ id: variant.id, label: variant.label || variant.key || 'variant', weight: variant.weight }))}
        onChangeWeight={handleWeightChange}
      />

      {variants.map((variant, index) => (
        <div key={variant.id} className="flex items-end gap-3">
          <div className="flex-1">
            <Label>Label</Label>
            <Input
              {...register(`variants.${index}.label`, {
                onChange: (e) => {
                  if (!variant.keyEdited) setValue(`variants.${index}.key`, slugify(e.target.value));
                },
              })}
              placeholder="e.g. Green button"
            />
          </div>
          <div className="flex-1">
            <Label>Variant key</Label>
            <Input
              {...register(`variants.${index}.key`, { onChange: () => setValue(`variants.${index}.keyEdited`, true) })}
              className="font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveVariant(variant.id)}
            disabled={variants.length <= 2}
            className="rounded-md px-2 py-2 text-sm text-destructive disabled:opacity-30"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAddVariant} className="text-sm font-medium text-foreground underline">
        + Add variant
      </button>

      {liveErrors.length > 0 && (
        <div className="rounded-md bg-warning/10 p-3 text-sm text-warning">
          {liveErrors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}
