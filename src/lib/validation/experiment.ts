import { z } from 'zod';
import { EXPERIMENT_STATUSES } from '@/lib/experiment-status';
import { enumField, numberField, optionalText, requiredText, SLUG_MESSAGE, SLUG_RE, stringField } from './fields';
import {
  CONVERSION_EVENT_MAX,
  CONVERSION_EVENT_MIN,
  DESCRIPTION_MAX,
  EXPERIMENT_KEY_MAX,
  EXPERIMENT_KEY_MIN,
  EXPERIMENT_NAME_MAX,
  EXPERIMENT_NAME_MIN,
} from './limits';
import { targetingSchema } from './targeting';
import { variantsSchema } from './variants';

// Empty is allowed: it means "no conversion event" (stored as null).
const CONVERSION_EVENT_RE = /^[a-z0-9_.-]*$/;

const experimentKeySchema = stringField()
  .min(1, { error: 'is required', abort: true })
  .min(EXPERIMENT_KEY_MIN, `must be at least ${EXPERIMENT_KEY_MIN} characters`)
  .max(EXPERIMENT_KEY_MAX, `must be at most ${EXPERIMENT_KEY_MAX} characters`)
  .regex(SLUG_RE, SLUG_MESSAGE);

const conversionEventSchema = stringField()
  .trim()
  .max(CONVERSION_EVENT_MAX, `must be at most ${CONVERSION_EVENT_MAX} characters`)
  .refine((value) => value.length === 0 || value.length >= CONVERSION_EVENT_MIN, {
    message: `must be at least ${CONVERSION_EVENT_MIN} characters`,
  })
  .regex(CONVERSION_EVENT_RE, 'may only contain lowercase letters, numbers, "_", "." and "-"')
  .optional();

const statusSchema = enumField(EXPERIMENT_STATUSES);

export const createExperimentSchema = z.object({
  key: experimentKeySchema,
  name: requiredText(EXPERIMENT_NAME_MIN, EXPERIMENT_NAME_MAX),
  description: optionalText(DESCRIPTION_MAX),
  conversionEvent: conversionEventSchema,
  status: statusSchema.default('draft'),
  variants: variantsSchema.default([]),
  targeting: targetingSchema.optional(),
});

// Every field optional: an absent field means "leave unchanged". A present
// field must still be valid — an empty name is rejected, not ignored.
export const updateExperimentSchema = z.object({
  name: requiredText(EXPERIMENT_NAME_MIN, EXPERIMENT_NAME_MAX).optional(),
  description: optionalText(DESCRIPTION_MAX),
  conversionEvent: conversionEventSchema,
  status: statusSchema.optional(),
  variants: variantsSchema.optional(),
  // null clears targeting, same as an empty array.
  targeting: targetingSchema.nullable().optional(),
  seed: numberField().int('must be an integer').optional(),
});
