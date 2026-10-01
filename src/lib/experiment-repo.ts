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
export function parseVariantsWithLabels(row: Pick<ExperimentRow, 'variantsJson'>): VariantWithLabel[] {
  return JSON.parse(row.variantsJson);
}

export function nameConflictMessage(name: string): string {
  return `name "${name}" is already used by another experiment`;
}

/** Case-insensitive, so "Checkout CTA" and "checkout cta" count as the same
 * name. `excludeKey` skips the experiment being renamed. */
export async function isExperimentNameTaken(projectId: string, name: string, excludeKey?: string): Promise<boolean> {
  const existing = await prisma.experiment.findFirst({
    where: { projectId, name: { equals: name, mode: 'insensitive' }, ...(excludeKey && { key: { not: excludeKey } }) },
    select: { id: true },
  });
  return existing !== null;
}

/** Every experiment key in the project mapped to its variant keys — what an
 * incoming exposure is checked against before it's allowed into the stats. */
export async function getVariantKeysByExperiment(projectId: string): Promise<Map<string, Set<string>>> {
  const rows = await prisma.experiment.findMany({ where: { projectId }, select: { key: true, variantsJson: true } });
  return new Map(
    rows.map((row) => [row.key, new Set(parseVariantsWithLabels(row).map((variant) => variant.key))])
  );
}

export async function listConfigsForProject(projectId: string): Promise<ExperimentConfig[]> {
  const rows = await prisma.experiment.findMany({ where: { projectId } });
  return rows.map(toConfig);
}

export async function getExperimentRow(projectId: string, key: string): Promise<ExperimentRow | null> {
  return prisma.experiment.findUnique({ where: { projectId_key: { projectId, key } } });
}
