import type { z } from 'zod';

export type ParseResult<T> = { success: true; data: T } | { success: false; errors: string[] };

export function formatIssues(issues: z.core.$ZodIssue[]): string[] {
  return issues.map(({ path, message }) => (path.length > 0 ? `${path.join('.')} ${message}` : message));
}

export function parseWith<S extends z.ZodType>(schema: S, input: unknown): ParseResult<z.output<S>> {
  const result = schema.safeParse(input);
  return result.success ? { success: true, data: result.data } : { success: false, errors: formatIssues(result.error.issues) };
}

/**
 * The one place request bodies cross from `unknown` into typed data. A
 * `request.json() as Body` cast only tells the compiler what we hope arrived;
 * this checks it, so a wrong-typed field becomes a 400 instead of a crash
 * (500) somewhere deeper in the handler.
 */
export async function parseJsonBody<S extends z.ZodType>(request: Request, schema: S): Promise<ParseResult<z.output<S>>> {
  const body: unknown = await request.json().catch(() => undefined);
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { success: false, errors: ['request body must be a JSON object'] };
  }
  return parseWith(schema, body);
}
