import { describe, expect, it } from 'vitest';
import { TARGETING_RULES_MAX, TARGETING_VALUE_MAX, TARGETING_VALUES_MAX } from './limits';
import { parseWith } from './parse';
import { targetingSchema } from './targeting';

const rule = (value: unknown) => ({ attribute: 'country', operator: 'in', value });

describe('targetingSchema limits', () => {
  it('caps the number of rules', () => {
    const rules = Array.from({ length: TARGETING_RULES_MAX + 1 }, () => rule(['us']));
    expect(parseWith(targetingSchema, rules)).toEqual({
      success: false,
      errors: [`can have at most ${TARGETING_RULES_MAX} rules`],
    });
  });

  it('caps the number of values in a rule', () => {
    const values = Array.from({ length: TARGETING_VALUES_MAX + 1 }, (_, index) => `v${index}`);
    expect(parseWith(targetingSchema, [rule(values)])).toEqual({
      success: false,
      errors: [`0.value can have at most ${TARGETING_VALUES_MAX} values`],
    });
  });

  it('caps the length of a single value, in a list or on its own', () => {
    const long = 'x'.repeat(TARGETING_VALUE_MAX + 1);
    const message = `must be at most ${TARGETING_VALUE_MAX} characters`;
    expect(parseWith(targetingSchema, [rule([long])])).toEqual({ success: false, errors: [`0.value.0 ${message}`] });
    expect(parseWith(targetingSchema, [{ ...rule(long), operator: 'eq' }])).toEqual({
      success: false,
      errors: [`0.value ${message}`],
    });
  });
});
