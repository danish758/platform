import { validateConfig, type ExperimentConfig } from '@cro-engine/assignment-engine';
import { validateTargeting } from './targeting-validation';

/**
 * The full validation pass the admin CRUD routes run before writing an
 * experiment: validateConfig() from @cro-engine/assignment-engine (key,
 * variants, weights) plus validateTargeting() (operator/value shape, plus
 * that each rule's attribute names a context key actually registered for
 * this project — see targeting-validation.ts). Pulled out as its own pure
 * function, rather than inlined in the route handlers, specifically so it's
 * testable without a Next.js request context (the routes themselves depend
 * on cookies() via getCurrentAccount(), which only works inside a real
 * request lifecycle — this doesn't). Async because validateTargeting() now
 * needs a DB read to check context-key membership.
 */
export async function validateExperimentInput(projectId: string, config: ExperimentConfig): Promise<string[]> {
  return [...validateConfig(config), ...(await validateTargeting(projectId, config.targeting ?? []))];
}
