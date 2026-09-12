import { prisma } from './db';
import { parseVariantsWithLabels } from './experiment-repo';
import { checkSampleRatioMismatch } from './srm';
import { analyzeExperimentRow } from './stats';
import { summarizeResult } from './stats-format';

export type AttentionRow = { key: string; name: string; reasonLabel: string };

const STALE_RUNNING_DAYS = 14;
const MS_PER_DAY = 86_400_000;

/**
 * Surfaces running experiments that need a human look, in priority order:
 * no traffic yet, a broken traffic split, or running long enough that it
 * should have a read by now but still doesn't. Only one reason is reported
 * per experiment even if more than one applies — the first one is the most
 * actionable.
 */
export async function getExperimentsRequiringAttention(projectId: string): Promise<AttentionRow[]> {
  const experiments = await prisma.experiment.findMany({
    where: { projectId, status: 'running' },
    orderBy: { key: 'asc' },
  });

  const rows: AttentionRow[] = [];
  for (const experiment of experiments) {
    const analysis = await analyzeExperimentRow(experiment);
    if (!analysis) continue;

    const totalVisitors = Object.values(analysis.statsByVariant).reduce((sum, variant) => sum + variant.visitors, 0);
    if (totalVisitors === 0) {
      rows.push({ key: experiment.key, name: experiment.name, reasonLabel: 'No data yet' });
      continue;
    }

    const variants = parseVariantsWithLabels(experiment);
    const observedVisitors = Object.fromEntries(
      Object.entries(analysis.statsByVariant).map(([variantKey, stat]) => [variantKey, stat.visitors])
    );
    const srm = checkSampleRatioMismatch(
      variants.map((variant) => ({ key: variant.key, weight: variant.weight })),
      observedVisitors
    );
    if (srm?.isMismatched) {
      rows.push({ key: experiment.key, name: experiment.name, reasonLabel: 'Sample ratio mismatch' });
      continue;
    }

    const runningDays = experiment.startedAt ? (Date.now() - experiment.startedAt.getTime()) / MS_PER_DAY : 0;
    if (runningDays < STALE_RUNNING_DAYS) continue;

    const { key: baselineKey } = variants[0] || {};
    const { tone } = summarizeResult(analysis, baselineKey);
    if (tone === 'pending') {
      rows.push({
        key: experiment.key,
        name: experiment.name,
        reasonLabel: `Running ${Math.floor(runningDays)}d, no result yet`,
      });
    }
  }

  return rows;
}
