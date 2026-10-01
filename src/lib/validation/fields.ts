import { z } from 'zod';

// Lowercase letters and numbers joined by single hyphens — for keys that end
// up in URLs and in the consuming app's code.
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MESSAGE = 'must be lowercase letters and numbers, separated by single hyphens';

// Messages are written as predicates ("is required", "must be ...") so that
// formatIssues() can prefix them with the field path: "name is required".
function typeMessage(expected: string): (issue: { input?: unknown }) => string {
  return (issue) => (issue.input === undefined ? 'is required' : `must be ${expected}`);
}

export function stringField(): z.ZodString {
  return z.string({ error: typeMessage('a string') });
}

export function numberField(): z.ZodNumber {
  // Zod 4's z.number() already rejects NaN and ±Infinity.
  return z.number({ error: typeMessage('a finite number') });
}

export function arrayField<T extends z.ZodType>(item: T): z.ZodArray<T> {
  return z.array(item, { error: typeMessage('an array') });
}

export function objectField<T extends z.ZodRawShape>(shape: T): z.ZodObject<T> {
  return z.object(shape, { error: typeMessage('an object') });
}

export function enumField<const T extends readonly [string, ...string[]]>(values: T): z.ZodEnum<{ [K in T[number]]: K }> {
  return z.enum(values, { error: `must be one of: ${values.join(', ')}` });
}

export function requiredText(min: number, max: number): z.ZodString {
  return stringField()
    .trim()
    // abort: an empty value reports only "is required", not also the minimum.
    .min(1, { error: 'is required', abort: true })
    .min(min, `must be at least ${min} characters`)
    .max(max, `must be at most ${max} characters`);
}

export function optionalText(max: number): z.ZodOptional<z.ZodString> {
  return stringField().trim().max(max, `must be at most ${max} characters`).optional();
}

/** Untrimmed, since identifiers like userId are opaque and whitespace may be significant. */
export function identifier(max: number): z.ZodString {
  return stringField().min(1, 'is required').max(max, `must be at most ${max} characters`);
}
