'use client';

import { useForm, type Path, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@/lib/validation/zod-resolver';

type ObjectSchema = z.ZodObject<z.ZodRawShape>;

type UseZodFormResult<S extends ObjectSchema> = UseFormReturn<z.input<S>, unknown, z.output<S>> & {
  /** Moves API errors that name a field (e.g. "name is already used…") onto
   * that field; returns the rest for the form-level message. */
  assignServerErrors: (errors: string[]) => string[];
};

/**
 * Validates on first blur, then on every change once a field has been
 * touched — no red text while someone is still typing for the first time.
 */
export function useZodForm<S extends ObjectSchema>(
  schema: S,
  options: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, 'resolver' | 'mode'> = {}
): UseZodFormResult<S> {
  const form = useForm<z.input<S>, unknown, z.output<S>>({ ...options, resolver: zodResolver(schema), mode: 'onTouched' });
  const fieldNames = Object.keys(schema.shape);

  function assignServerErrors(errors: string[]): string[] {
    return errors.filter((error) => {
      const fieldName = fieldNames.find((name) => error.startsWith(`${name} `));
      if (!fieldName) return true;
      form.setError(fieldName as Path<z.input<S>>, { type: 'server', message: error.slice(fieldName.length + 1) });
      return false;
    });
  }

  return { ...form, assignServerErrors };
}
