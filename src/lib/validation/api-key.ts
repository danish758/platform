import { z } from 'zod';
import { requiredText } from './fields';
import { LABEL_MAX, LABEL_MIN } from './limits';

// Required so a key can be told apart (and safely revoked) later.
export const createApiKeySchema = z.object({
  label: requiredText(LABEL_MIN, LABEL_MAX),
});
