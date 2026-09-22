import type { TargetingOperator } from '@cro-engine/assignment-engine';

/**
 * Raw operator codes aren't self-explanatory to a non-technical admin —
 * this is purely a display concern, the engine's TargetingOperator values
 * themselves are unchanged.
 */
export const OPERATOR_LABELS: Record<TargetingOperator, string> = {
  eq: 'is equal to',
  neq: 'is not equal to',
  in: 'is one of',
  notIn: 'is not one of',
  gt: 'is greater than',
  lt: 'is less than',
};

/** Compact symbol shown in the collapsed operator control — the full
 * OPERATOR_LABELS text is what shows per-row in the picker's open list. */
export const OPERATOR_SYMBOLS: Record<TargetingOperator, string> = {
  eq: '=',
  neq: '≠',
  gt: '>',
  lt: '<',
  in: 'in',
  notIn: 'not in',
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
