import type { TargetingOperator } from '@cro-engine/assignment-engine';
import { OPERATORS_BY_TYPE, type ContextKeyType } from '@/lib/targeting-labels';

export type VariantRow = { id: string; key: string; keyEdited: boolean; weight: number; label: string };
export type TargetingRow = { id: string; attribute: string; operator: TargetingOperator; value: string[] };
export type ContextKeySummary = { id: string; key: string; label: string | null; type: string };

export function newId(): string {
  return crypto.randomUUID();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Coerces each targeting row's chip values per its operator, matching the
 * shape the server's validateTargeting()/evaluateRule() expect — gt/lt need
 * a real number, in/notIn a real array, eq/neq a plain string. The
 * TagInput's `max` prop already keeps eq/gt/lt down to exactly one chip. */
export function coerceTargetingRow(row: TargetingRow): { attribute: string; operator: TargetingOperator; value: string | number | string[] } {
  if (row.operator === 'gt' || row.operator === 'lt') {
    return { attribute: row.attribute, operator: row.operator, value: Number(row.value[0]) };
  }
  if (row.operator === 'in' || row.operator === 'notIn') {
    return { attribute: row.attribute, operator: row.operator, value: row.value };
  }
  return { attribute: row.attribute, operator: row.operator, value: row.value[0] ?? '' };
}

export function contextKeyMap(contextKeys: ContextKeySummary[]): Map<string, ContextKeySummary> {
  return new Map(contextKeys.map((contextKey) => [contextKey.key, contextKey]));
}

export function operatorsForAttribute(attribute: string, contextKeyByName: Map<string, ContextKeySummary>): TargetingOperator[] {
  const { type } = contextKeyByName.get(attribute) || {};
  return OPERATORS_BY_TYPE[(type ?? 'string') as ContextKeyType];
}

export function maxValuesForOperator(operator: TargetingOperator): number | undefined {
  return operator === 'in' || operator === 'notIn' ? undefined : 1;
}
