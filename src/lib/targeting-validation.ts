import type { TargetingRule } from '@cro-engine/assignment-engine';
import { prisma } from './db';
import { OPERATORS_BY_TYPE, type ContextKeyType } from './targeting-labels';

const KNOWN_OPERATORS = new Set(['eq', 'neq', 'in', 'notIn', 'gt', 'lt']);

/**
 * validateConfig() from @cro-engine/assignment-engine deliberately does not
 * validate targeting shape (confirmed by reading its source) — a malformed
 * rule doesn't error there, it just silently excludes everyone at
 * evaluation time per the engine's fail-closed design. That's correct
 * behavior for the engine, but wrong for an admin API accepting arbitrary
 * input: a typo should come back as a 400, not a silently-broken experiment.
 * This is the shape check the admin CRUD routes run in addition to
 * validateConfig() — plus, beyond shape, that the attribute actually names
 * a context key registered for this project (and that the operator is
 * valid for that key's declared type). That second part needs a DB read,
 * which is why this function is async where it previously wasn't.
 */
export async function validateTargeting(projectId: string, rules: TargetingRule[]): Promise<string[]> {
  const errors: string[] = [];

  const contextKeys = rules.length > 0
    ? await prisma.contextKey.findMany({ where: { projectId } })
    : [];
  const byKey = new Map(contextKeys.map((k) => [k.key, k]));

  for (const rule of rules) {
    if (!rule.attribute || rule.attribute.trim().length === 0) {
      errors.push('every targeting rule needs a non-empty attribute name');
      continue;
    }
    if (!KNOWN_OPERATORS.has(rule.operator)) {
      errors.push(`unknown targeting operator "${rule.operator}"`);
      continue;
    }
    if (rule.operator === 'gt' || rule.operator === 'lt') {
      if (typeof rule.value !== 'number' || !Number.isFinite(rule.value)) {
        errors.push(`"${rule.attribute}" (${rule.operator}) needs a numeric value`);
      }
    } else if (rule.operator === 'in' || rule.operator === 'notIn') {
      if (!Array.isArray(rule.value) || rule.value.length === 0) {
        errors.push(`"${rule.attribute}" (${rule.operator}) needs a non-empty list of values`);
      }
    } else if (typeof rule.value !== 'string' || rule.value.trim().length === 0) {
      errors.push(`"${rule.attribute}" (${rule.operator}) needs a non-empty string value`);
    }

    const contextKey = byKey.get(rule.attribute);
    if (!contextKey) {
      errors.push(`"${rule.attribute}" is not a registered context key for this project`);
      continue;
    }
    const allowedOperators = OPERATORS_BY_TYPE[contextKey.type as ContextKeyType];
    if (!allowedOperators.includes(rule.operator)) {
      errors.push(`operator "${rule.operator}" is not valid for "${rule.attribute}" (a ${contextKey.type} key)`);
    }
  }

  return errors;
}
