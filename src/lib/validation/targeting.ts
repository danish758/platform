import type { TargetingOperator } from '@cro-engine/assignment-engine';
import { z } from 'zod';
import { arrayField, enumField, numberField, objectField, stringField } from './fields';
import { CONTEXT_KEY_MAX, TARGETING_RULES_MAX, TARGETING_VALUE_MAX, TARGETING_VALUES_MAX } from './limits';

const TARGETING_OPERATORS = ['eq', 'neq', 'in', 'notIn', 'gt', 'lt'] as const satisfies readonly TargetingOperator[];

const valueTextSchema = stringField().max(TARGETING_VALUE_MAX, `must be at most ${TARGETING_VALUE_MAX} characters`);

// Shape and size only — operator/value compatibility and whether the
// attribute is a registered context key are validateTargeting()'s job.
const targetingRuleSchema = objectField({
  attribute: stringField().max(CONTEXT_KEY_MAX, `must be at most ${CONTEXT_KEY_MAX} characters`),
  operator: enumField(TARGETING_OPERATORS),
  value: z.union(
    [
      valueTextSchema,
      numberField(),
      arrayField(valueTextSchema).max(TARGETING_VALUES_MAX, `can have at most ${TARGETING_VALUES_MAX} values`),
    ],
    { error: 'must be a string, a number, or a list of strings' }
  ),
});

export const targetingSchema = arrayField(targetingRuleSchema).max(
  TARGETING_RULES_MAX,
  `can have at most ${TARGETING_RULES_MAX} rules`
);
