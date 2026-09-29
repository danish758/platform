import { arrayField, identifier, numberField, objectField, requiredText, SLUG_MESSAGE, SLUG_RE } from './fields';
import { LABEL_MAX, LABEL_MIN, VARIANT_KEY_MAX, VARIANTS_MAX } from './limits';

// Weights summing to 100 and unique keys are left to validateConfig(). Key
// format and label uniqueness need the whole list (and the stored keys), so
// they're checked by variantListErrors() instead of here.
export const variantSchema = objectField({
  key: identifier(VARIANT_KEY_MAX),
  weight: numberField(),
  label: requiredText(LABEL_MIN, LABEL_MAX),
});

export const variantsSchema = arrayField(variantSchema).max(VARIANTS_MAX, `can have at most ${VARIANTS_MAX} entries`);

export type VariantFieldErrors = Partial<Record<'key' | 'label', string>>;

type VariantKeyAndLabel = { key: string; label?: string };

function normalizeLabel(label: string | undefined): string {
  return (label ?? '').trim().toLowerCase();
}

/**
 * Rules that need the whole list rather than one variant at a time. Keys
 * already stored on the experiment are exempt from the format rule — some
 * predate it (e.g. "variant 1"), and renaming a key would orphan the
 * exposures recorded under it.
 */
export function variantListErrors(
  variants: VariantKeyAndLabel[],
  storedKeys: ReadonlySet<string> = new Set()
): VariantFieldErrors[] {
  return variants.map((variant, index) => {
    const errors: VariantFieldErrors = {};
    if (variant.key && !storedKeys.has(variant.key) && !SLUG_RE.test(variant.key)) {
      errors.key = SLUG_MESSAGE;
    }
    const label = normalizeLabel(variant.label);
    const isRepeat = label !== '' && variants.slice(0, index).some((earlier) => normalizeLabel(earlier.label) === label);
    if (isRepeat) errors.label = 'is already used by another variant';
    return errors;
  });
}

/** variantListErrors() flattened into API-style messages ("variants.1.key …"). */
export function formatVariantListErrors(variants: VariantKeyAndLabel[], storedKeys?: ReadonlySet<string>): string[] {
  return variantListErrors(variants, storedKeys).flatMap((errors, index) =>
    Object.entries(errors).map(([field, message]) => `variants.${index}.${field} ${message}`)
  );
}
