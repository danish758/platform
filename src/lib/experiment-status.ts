import type { ExperimentStatus } from '@cro-engine/assignment-engine';

export const EXPERIMENT_STATUSES = ['draft', 'running', 'stopped'] as const satisfies readonly ExperimentStatus[];

export function isExperimentStatus(value: unknown): value is ExperimentStatus {
  return typeof value === 'string' && (EXPERIMENT_STATUSES as readonly string[]).includes(value);
}

// Changing who's eligible, how traffic splits, or how visitors hash into
// buckets mid-run mixes two different experiments into one set of results.
export const RUN_LOCKED_FIELDS = ['variants', 'targeting', 'seed'] as const;

type RunLockedField = (typeof RUN_LOCKED_FIELDS)[number];

export function runLockErrors(status: ExperimentStatus, changes: Partial<Record<RunLockedField, unknown>>): string[] {
  if (status !== 'running') return [];
  return RUN_LOCKED_FIELDS.filter((field) => changes[field] !== undefined).map(
    (field) => `${field} can't be changed while the experiment is running. Stop it first.`
  );
}
