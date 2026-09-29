import { describe, expect, it } from 'vitest';
import { createApiKeySchema } from './api-key';
import { signupSchema } from './auth';
import { eventsBatchSchema, partitionEvents } from './events';
import { createExperimentSchema, updateExperimentSchema } from './experiment';
import { EVENTS_PER_BATCH_MAX, PROJECT_NAME_MAX } from './limits';
import { parseJsonBody, parseWith } from './parse';
import { createProjectSchema } from './project';

function jsonRequest(body: string): Request {
  return new Request('http://localhost/test', { method: 'POST', body });
}

describe('parseJsonBody', () => {
  it('rejects a body that is not a JSON object', async () => {
    for (const body of ['not json', '[]', 'null', '42']) {
      const result = await parseJsonBody(jsonRequest(body), createProjectSchema);
      expect(result).toEqual({ success: false, errors: ['request body must be a JSON object'] });
    }
  });

  it('returns trimmed, typed data on success', async () => {
    const result = await parseJsonBody(jsonRequest(JSON.stringify({ name: '  Storefront  ' })), createProjectSchema);
    expect(result).toEqual({ success: true, data: { name: 'Storefront' } });
  });
});

describe('field messages', () => {
  it('distinguishes missing from wrong-typed fields', () => {
    expect(parseWith(createProjectSchema, {})).toEqual({ success: false, errors: ['name is required'] });
    expect(parseWith(createProjectSchema, { name: 123 })).toEqual({ success: false, errors: ['name must be a string'] });
    expect(parseWith(createProjectSchema, { name: '   ' })).toEqual({ success: false, errors: ['name is required'] });
  });

  it('enforces max length', () => {
    const result = parseWith(createProjectSchema, { name: 'a'.repeat(PROJECT_NAME_MAX + 1) });
    expect(result).toEqual({ success: false, errors: [`name must be at most ${PROJECT_NAME_MAX} characters`] });
  });

  it('prefixes nested paths', () => {
    const result = parseWith(createExperimentSchema, {
      key: 'checkout-cta',
      name: 'Checkout CTA',
      variants: [{ key: 'control', weight: '50', label: 'Control' }],
    });
    expect(result).toEqual({ success: false, errors: ['variants.0.weight must be a finite number'] });
  });
});

describe('minimum lengths', () => {
  it('rejects names and labels that are too short, but reports empty as required', () => {
    expect(parseWith(createProjectSchema, { name: 'ab' })).toEqual({
      success: false,
      errors: ['name must be at least 3 characters'],
    });
    expect(parseWith(createExperimentSchema, { key: 'checkout', name: 'a' })).toEqual({
      success: false,
      errors: ['name must be at least 3 characters'],
    });
    expect(parseWith(createExperimentSchema, { key: '', name: 'Checkout' })).toEqual({
      success: false,
      errors: ['key is required'],
    });
  });

  it('requires an API key label', () => {
    expect(parseWith(createApiKeySchema, {})).toEqual({ success: false, errors: ['label is required'] });
    expect(parseWith(createApiKeySchema, { label: 'production' }).success).toBe(true);
  });

  it('requires a label and a non-empty key on every variant', () => {
    const result = parseWith(createExperimentSchema, {
      key: 'checkout',
      name: 'Checkout',
      variants: [{ key: '', weight: 50, label: '  ' }],
    });
    expect(result).toEqual({
      success: false,
      errors: ['variants.0.key is required', 'variants.0.label is required'],
    });
  });

  it('accepts an empty conversion event but not a too-short one', () => {
    expect(parseWith(updateExperimentSchema, { conversionEvent: '' }).success).toBe(true);
    expect(parseWith(updateExperimentSchema, { conversionEvent: 'ab' }).success).toBe(false);
  });
});

describe('experiment key', () => {
  it.each(['ab', 'Checkout', 'double--hyphen', 'trailing-', '-leading', 'under_score'])('rejects %s', (key) => {
    expect(parseWith(createExperimentSchema, { key, name: 'Checkout' }).success).toBe(false);
  });

  it.each(['abc', 'checkout-cta', 'v2-hero-copy'])('accepts %s', (key) => {
    expect(parseWith(createExperimentSchema, { key, name: 'Checkout' }).success).toBe(true);
  });
});

describe('updateExperimentSchema', () => {
  it('rejects an empty name instead of silently ignoring it', () => {
    expect(parseWith(updateExperimentSchema, { name: '' })).toEqual({ success: false, errors: ['name is required'] });
  });

  it('allows clearing description and conversion event with an empty string', () => {
    expect(parseWith(updateExperimentSchema, { description: '', conversionEvent: '' }).success).toBe(true);
  });

  it('rejects a conversion event with uppercase letters or spaces', () => {
    expect(parseWith(updateExperimentSchema, { conversionEvent: 'Purchase Completed' }).success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('normalizes the email and caps the password length', () => {
    expect(parseWith(signupSchema, { email: ' Me@Example.COM ', password: 'longenough' })).toEqual({
      success: true,
      data: { email: 'me@example.com', password: 'longenough' },
    });
    expect(parseWith(signupSchema, { email: 'me@example.com', password: 'x'.repeat(129) }).success).toBe(false);
  });
});

const KNOWN_VARIANTS = new Map([['exp', new Set(['control', 'variant'])]]);

describe('events', () => {
  it('rejects a batch over the size cap', () => {
    const exposures = Array.from({ length: EVENTS_PER_BATCH_MAX + 1 }, () => ({}));
    expect(parseWith(eventsBatchSchema, { exposures }).success).toBe(false);
  });

  it('rejects non-array exposures', () => {
    expect(parseWith(eventsBatchSchema, { exposures: 'nope' })).toEqual({
      success: false,
      errors: ['exposures must be an array'],
    });
  });

  it('keeps valid events and reports invalid ones by index', () => {
    const parsed = parseWith(eventsBatchSchema, {
      exposures: [{ userId: 'u1', experimentKey: 'exp', variantKey: 'control' }, { userId: 'u2' }],
      conversions: [{ userId: 'u1', eventName: 'purchase', value: 'ten' }, { userId: 'u1', eventName: 'purchase' }],
    });
    if (!parsed.success) throw new Error('batch should parse');

    const { exposures, conversions, rejected } = partitionEvents(parsed.data, KNOWN_VARIANTS);
    expect(exposures).toHaveLength(1);
    expect(conversions).toHaveLength(1);
    expect(rejected).toEqual([
      { type: 'exposure', index: 1, errors: ['experimentKey is required', 'variantKey is required'] },
      { type: 'conversion', index: 0, errors: ['value must be a finite number'] },
    ]);
  });

  it('drops exposures for unknown experiments or variants', () => {
    const parsed = parseWith(eventsBatchSchema, {
      exposures: [
        { userId: 'u1', experimentKey: 'missing', variantKey: 'control' },
        { userId: 'u1', experimentKey: 'exp', variantKey: 'nope' },
      ],
    });
    if (!parsed.success) throw new Error('batch should parse');

    const { exposures, rejected } = partitionEvents(parsed.data, KNOWN_VARIANTS);
    expect(exposures).toHaveLength(0);
    expect(rejected).toEqual([
      { type: 'exposure', index: 0, errors: ['experimentKey "missing" does not exist in this project'] },
      { type: 'exposure', index: 1, errors: ['variantKey "nope" is not a variant of "exp"'] },
    ]);
  });
});
