import type { Experiment as ExperimentRow } from '@prisma/client';
import type { ExperimentConfig } from '@cro-engine/assignment-engine';
import { prisma } from './db';

/**
 * A variant as stored in variantsJson: the engine-facing {key, weight} plus
 * an optional admin-only display label (e.g. "Green Button" for the
 * SDK-facing key "variant-a") — the same key/label split AB Tasty uses.
 * `label` is deliberately not part of @cro-engine/assignment-engine's
 * VariantWeight type: it's pure platform display metadata, never needed by
 * anything that evaluates bucketing.
 */
export type VariantWithLabel = { key: string; weight: number; label?: string };

/**
 * Maps a Prisma Experiment row to the assignment-engine's ExperimentConfig
 * shape, parsing the JSON columns and stripping admin-only display metadata
 * (name/description/variant labels aren't part of ExperimentConfig — they're
 * not needed by anything that evaluates bucketing, only by the dashboard/
 * admin UI). Centralized here so the JSON parse/shape logic exists in
 * exactly one place, used by the public config API, the admin CRUD routes,
 * and stats.
 */
export function toConfig(row: ExperimentRow): ExperimentConfig {
  return {
    key: row.key,
    status: row.status,
    variants: (JSON.parse(row.variantsJson) as VariantWithLabel[]).map((variant) => ({ key: variant.key, weight: variant.weight })),
    targeting: row.targetingJson ? JSON.parse(row.targetingJson) : undefined,
    seed: row.seed ?? undefined,
  };
}

/** Same source data as toConfig(), but keeps the admin-only `label` field —
 * for the wizard's edit page and the dashboard, which do need it. */
export function parseVariantsWithLabels(row: ExperimentRow): VariantWithLabel[] {
  return JSON.parse(row.variantsJson);
}

export async function listConfigsForProject(projectId: string): Promise<ExperimentConfig[]> {
  const rows = await prisma.experiment.findMany({ where: { projectId } });
  return rows.map(toConfig);
}

export async function getExperimentRow(projectId: string, key: string): Promise<ExperimentRow | null> {
  return prisma.experiment.findUnique({ where: { projectId_key: { projectId, key } } });
}
