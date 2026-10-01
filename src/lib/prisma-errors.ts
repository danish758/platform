const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/** With `field`, only matches a violation of a constraint covering that
 * column — for tables with more than one unique constraint. */
export function isUniqueConstraintError(err: unknown, field?: string): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err) || err.code !== UNIQUE_CONSTRAINT_VIOLATION) {
    return false;
  }
  if (!field) return true;
  const { meta } = err as { meta?: { target?: unknown } };
  const { target } = meta || {};
  return Array.isArray(target) ? target.includes(field) : String(target).includes(field);
}
