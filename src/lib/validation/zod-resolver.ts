import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

// Keyed by dotted path, first issue per field wins. Fine for the flat forms
// this is used with; nested field arrays would need a real object tree.
function toFieldErrors<T extends FieldValues>(issues: z.core.$ZodIssue[]): FieldErrors<T> {
  const entries = issues.map((issue) => [issue.path.join('.'), { type: issue.code, message: issue.message }] as const);
  return Object.fromEntries(entries.reverse()) as FieldErrors<T>;
}

/** Runs the same Zod schema the API route parses with, so client and server
 * can't disagree about what's valid. */
export function zodResolver<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S
): Resolver<z.input<S>, unknown, z.output<S>> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    return result.success
      ? { values: result.data, errors: {} }
      : { values: {}, errors: toFieldErrors<z.input<S>>(result.error.issues) };
  };
}
