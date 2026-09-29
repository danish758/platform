import type { TargetingOperator } from '@cro-engine/assignment-engine';
import { OPERATORS_BY_TYPE, type ContextKeyType } from '@/lib/targeting-labels';
import { EXPERIMENT_KEY_MAX, TARGETING_VALUES_MAX } from '@/lib/validation/limits';
import { variantListErrors, variantSchema, type VariantFieldErrors } from '@/lib/validation/variants';

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

function rowSchemaErrors(row: VariantRow): VariantFieldErrors {
  const result = variantSchema.safeParse({ key: row.key, weight: row.weight, label: row.label });
  if (result.success) return {};
  const entries = result.error.issues.map((issue) => [String(issue.path[0]), issue.message] as const);
  return Object.fromEntries(entries.reverse());
}

/** Per-row field messages from the same rules the API applies — the row's
 * own shape first, then list-wide rules (key format, repeated labels).
 * Weights and duplicate keys stay with validateConfig()'s banner. */
export function variantRowsErrors(rows: VariantRow[], storedKeys: ReadonlySet<string>): VariantFieldErrors[] {
  const listErrors = variantListErrors(rows, storedKeys);
  return rows.map((row, index) => ({ ...listErrors[index], ...rowSchemaErrors(row) }));
}

/** A key derived from a long name is truncated rather than left to fail
 * validation the user didn't cause. */
export function experimentKeyFromName(name: string): string {
  return slugify(name).slice(0, EXPERIMENT_KEY_MAX).replace(/-+$/, '');
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

export function maxValuesForOperator(operator: TargetingOperator): number {
  return operator === 'in' || operator === 'notIn' ? TARGETING_VALUES_MAX : 1;
}
