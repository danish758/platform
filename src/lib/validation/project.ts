import { z } from 'zod';
import { requiredText } from './fields';
import { PROJECT_NAME_MAX, PROJECT_NAME_MIN } from './limits';

export const createProjectSchema = z.object({
  name: requiredText(PROJECT_NAME_MIN, PROJECT_NAME_MAX),
});
