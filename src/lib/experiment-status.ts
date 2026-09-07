import type { ExperimentStatus } from '@cro-engine/assignment-engine';

export const EXPERIMENT_STATUSES: ExperimentStatus[] = ['draft', 'running', 'stopped'];

export function isExperimentStatus(value: unknown): value is ExperimentStatus {
  return typeof value === 'string' && (EXPERIMENT_STATUSES as string[]).includes(value);
}
