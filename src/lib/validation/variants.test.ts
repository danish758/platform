import { describe, expect, it } from 'vitest';
import { createExperimentSchema } from './experiment';
import { VARIANTS_MAX } from './limits';
import { parseWith } from './parse';
import { formatVariantListErrors, variantListErrors } from './variants';

describe('variantListErrors', () => {
  it('rejects keys with spaces, capitals, or stray hyphens', () => {
    const errors = variantListErrors([
      { key: 'variant 1', label: 'One' },
      { key: 'Variant', label: 'Two' },
      { key: 'double--hyphen', label: 'Three' },
      { key: 'variant-2', label: 'Four' },
    ]);
    expect(errors.map((error) => Boolean(error.key))).toEqual([true, true, true, false]);
  });

  it('exempts keys already stored on the experiment', () => {
    const errors = variantListErrors([{ key: 'variant 1', label: 'Green button' }], new Set(['variant 1']));
    expect(errors).toEqual([{}]);
  });

  it('flags a repeated label (case-insensitive) on the later variant only', () => {
    const errors = variantListErrors([
      { key: 'control', label: 'Green button' },
      { key: 'variant', label: '  green BUTTON ' },
    ]);
    expect(errors).toEqual([{}, { label: 'is already used by another variant' }]);
  });

  it('formats as API messages', () => {
    expect(formatVariantListErrors([{ key: 'bad key', label: 'A label' }])).toEqual([
      'variants.0.key must be lowercase letters and numbers, separated by single hyphens',
    ]);
  });
});

describe('variant count', () => {
  it(`allows at most ${VARIANTS_MAX} variants`, () => {
    const variants = Array.from({ length: VARIANTS_MAX + 1 }, (_, index) => ({
      key: `v${index}`,
      weight: 1,
      label: `Variant ${index}`,
    }));
    const result = parseWith(createExperimentSchema, { key: 'checkout', name: 'Checkout', variants });
    expect(result).toEqual({ success: false, errors: [`variants can have at most ${VARIANTS_MAX} entries`] });
  });
});
