import { z } from 'zod';
import type { ContextKeyType } from '@/lib/targeting-labels';
import { enumField, requiredText, stringField } from './fields';
import { CONTEXT_KEY_MAX, CONTEXT_KEY_MIN, LABEL_MAX, LABEL_MIN } from './limits';

const CONTEXT_KEY_RE = /^[a-z0-9][a-z0-9_]*$/;
const CONTEXT_KEY_TYPES = ['string', 'number'] as const satisfies readonly ContextKeyType[];

export const createContextKeySchema = z.object({
  key: stringField()
    .min(1, { error: 'is required', abort: true })
    .min(CONTEXT_KEY_MIN, `must be at least ${CONTEXT_KEY_MIN} characters`)
    .max(CONTEXT_KEY_MAX, `must be at most ${CONTEXT_KEY_MAX} characters`)
    .regex(CONTEXT_KEY_RE, 'must be lowercase letters, numbers, and underscores only'),
  label: requiredText(LABEL_MIN, LABEL_MAX),
  type: enumField(CONTEXT_KEY_TYPES),
});
