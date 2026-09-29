'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { VariantAllocationSliders } from '@/components/VariantAllocationSliders';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify, type VariantRow } from '@/lib/experiment-form';
import { VARIANTS_MAX } from '@/lib/validation/limits';
import type { VariantFieldErrors } from '@/lib/validation/variants';

export function VariantsEditor({
  variants,
  onChange,
  onChangeWeight,
  onAdd,
  onRemove,
  liveErrors,
  rowErrors,
  showAllErrors,
}: {
  variants: VariantRow[];
  /** Label/key edits — no rebalancing needed, so the editor computes the new array itself. */
  onChange: (next: VariantRow[]) => void;
  /** Weight changes need proportional rebalancing across every other variant — left to the caller. */
  onChangeWeight: (index: number, weight: number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  liveErrors: string[];
  /** Field errors per row, index-aligned with `variants`. */
  rowErrors: VariantFieldErrors[];
  /** Set after a save attempt, so errors show even on fields never blurred. */
  showAllErrors: boolean;
}) {
  // Same timing as the other forms: a field's error appears once it's been
  // left, not while a freshly added row is still empty.
  const [touchedFieldIds, setTouchedFieldIds] = useState<ReadonlySet<string>>(new Set());

  function markTouched(fieldId: string) {
    setTouchedFieldIds((previous) => new Set(previous).add(fieldId));
  }

  function visibleError(fieldId: string, error: string | undefined): string | undefined {
    return showAllErrors || touchedFieldIds.has(fieldId) ? error : undefined;
  }

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

      {variants.map((variant, index) => {
        const labelId = `${variant.id}-label`;
        const keyId = `${variant.id}-key`;
        const { label: rawLabelError, key: rawKeyError } = rowErrors[index] || {};
        const labelError = visibleError(labelId, rawLabelError);
        const keyError = visibleError(keyId, rawKeyError);
        return (
          <div key={variant.id} className="flex items-start gap-3">
            <div className="flex-1">
              <Label htmlFor={labelId}>Label</Label>
              <Input
                id={labelId}
                onBlur={() => markTouched(labelId)}
                value={variant.label}
                onChange={(e) => {
                  const label = e.target.value;
                  updateVariant(index, variant.keyEdited ? { label } : { label, key: slugify(label) });
                }}
                placeholder="e.g. Green button"
                aria-invalid={Boolean(labelError)}
                className="mt-2"
              />
              {labelError && <InlineError message={`Label ${labelError}`} />}
            </div>
            <div className="flex-1">
              <Label htmlFor={keyId}>Variant key</Label>
              <Input
                id={keyId}
                onBlur={() => markTouched(keyId)}
                value={variant.key}
                onChange={(e) => updateVariant(index, { key: e.target.value, keyEdited: true })}
                aria-invalid={Boolean(keyError)}
                className="mt-2 font-mono"
              />
              {keyError && <InlineError message={`Variant key ${keyError}`} />}
            </div>
            <div>
              <Label className="invisible">Remove</Label>
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
        );
      })}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onAdd}
          disabled={variants.length >= VARIANTS_MAX}
          className="h-auto gap-2 px-1 text-base font-medium text-primary hover:bg-transparent hover:text-primary/80"
        >
          <Plus className="h-5 w-5" />
          Add variant
        </Button>
        {variants.length >= VARIANTS_MAX && (
          <span className="text-sm text-muted-foreground">Up to {VARIANTS_MAX} variants per experiment.</span>
        )}
      </div>

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
