'use client';

import { Plus, X } from 'lucide-react';
import { VariantAllocationSliders } from '@/components/VariantAllocationSliders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify, type VariantRow } from '@/lib/experiment-form';

export function VariantsEditor({
  variants,
  onChange,
  onChangeWeight,
  onAdd,
  onRemove,
  liveErrors,
}: {
  variants: VariantRow[];
  /** Label/key edits — no rebalancing needed, so the editor computes the new array itself. */
  onChange: (next: VariantRow[]) => void;
  /** Weight changes need proportional rebalancing across every other variant — left to the caller. */
  onChangeWeight: (index: number, weight: number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  liveErrors: string[];
}) {
  function updateVariant(index: number, patch: Partial<VariantRow>) {
    onChange(variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Label is just for this dashboard; variant key is what the SDK actually sends.
      </p>
      <VariantAllocationSliders
        segments={variants.map((variant) => ({ id: variant.id, label: variant.label || variant.key || 'variant', weight: variant.weight }))}
        onChangeWeight={onChangeWeight}
      />

      {variants.map((variant, index) => (
        <div key={variant.id} className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-base">Label</Label>
            <Input
              value={variant.label}
              onChange={(e) => {
                const label = e.target.value;
                updateVariant(index, variant.keyEdited ? { label } : { label, key: slugify(label) });
              }}
              placeholder="e.g. Green button"
              className="mt-2 h-12 text-base md:text-base"
            />
          </div>
          <div className="flex-1">
            <Label className="text-base">Variant key</Label>
            <Input
              value={variant.key}
              onChange={(e) => updateVariant(index, { key: e.target.value, keyEdited: true })}
              className="mt-2 h-12 font-mono text-base md:text-base"
            />
          </div>
          <div>
            <Label className="invisible text-base">Remove</Label>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onRemove(variant.id)}
              disabled={variants.length <= 2}
              aria-label="Remove variant"
              className="mt-2 h-12 w-12 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        onClick={onAdd}
        className="h-auto gap-2 px-1 text-base font-medium text-primary hover:bg-transparent hover:text-primary/80"
      >
        <Plus className="h-5 w-5" />
        Add variant
      </Button>

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
