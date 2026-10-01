import { z } from 'zod';
import { stringField } from './fields';
import { EMAIL_MAX, PASSWORD_MAX, PASSWORD_MIN } from './limits';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailSchema = stringField()
  .trim()
  .toLowerCase()
  .min(1, 'is required')
  .max(EMAIL_MAX, `must be at most ${EMAIL_MAX} characters`);

const passwordMaxMessage = `must be at most ${PASSWORD_MAX} characters`;

export const signupSchema = z.object({
  email: emailSchema.regex(EMAIL_RE, 'must be a valid email address'),
  password: stringField()
    .min(PASSWORD_MIN, `must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, passwordMaxMessage),
});

// No format/min-length checks on login — those would only reveal the signup
// rules; a wrong credential just gets the generic "Invalid email or password".
export const loginSchema = z.object({
  email: emailSchema,
  password: stringField().min(1, 'is required').max(PASSWORD_MAX, passwordMaxMessage),
});
