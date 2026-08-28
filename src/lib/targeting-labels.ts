import type { TargetingOperator } from '@cro-engine/assignment-engine';

/**
 * Raw operator codes aren't self-explanatory to a non-technical admin —
 * this is purely a display concern, the engine's TargetingOperator values
 * themselves are unchanged.
 */
export const OPERATOR_LABELS: Record<TargetingOperator, string> = {
  eq: 'is',
  neq: 'is not',
  in: 'is one of',
  notIn: 'is not one of',
  gt: 'greater than',
  lt: 'less than',
};

export type ContextKeyType = 'string' | 'number';

/**
 * Which operators make sense for a context key's declared type. gt/lt are
 * excluded for string keys because evaluateRule() requires
 * `typeof actual === 'number'` for both — offering them for a string key
 * would let an admin build a rule that can never match. in/notIn are
 * offered for both types: evaluateRule()'s in/notIn branches only check
 * Array.isArray(rule.value) and use .includes(actual), with no type
 * constraint in the engine itself, so restricting them in the UI would be
 * an arbitrary limitation rather than one grounded in how the engine
 * actually evaluates rules.
 */
export const OPERATORS_BY_TYPE: Record<ContextKeyType, TargetingOperator[]> = {
  string: ['eq', 'neq', 'in', 'notIn'],
  number: ['eq', 'neq', 'gt', 'lt', 'in', 'notIn'],
};
