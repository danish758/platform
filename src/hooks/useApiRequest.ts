'use client';

import { useState } from 'react';

type ApiErrorBody = { errors?: string[]; error?: string };

/**
 * Shared fetch-and-surface-errors shape for every admin mutation (create,
 * delete, revoke, rerandomize, logout): call `run`, get back the parsed JSON
 * body on success or `null` on failure with `error`/`errors` populated from
 * the API's `{ error }` / `{ errors }` response shape. Centralizing this
 * means every caller checks `res.ok` and surfaces a message the same way,
 * instead of each component re-implementing (or forgetting to implement) it.
 */
export function useApiRequest() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function run<T = unknown>(input: RequestInfo, init: RequestInit, fallbackError: string): Promise<T | null> {
    setPending(true);
    setErrors([]);

    const res = await fetch(input, init);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const { errors: bodyErrors = [], error: bodyError } = body as ApiErrorBody;
      setErrors(bodyErrors.length > 0 ? bodyErrors : [bodyError ?? fallbackError]);
      setPending(false);
      return null;
    }

    setPending(false);
    return body as T;
  }

  return { run, pending, errors, error: errors[0] ?? null };
}
