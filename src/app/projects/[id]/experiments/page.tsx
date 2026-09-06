import { ExperimentsTable, type ExperimentRow } from '@/components/ExperimentsTable';
import { prisma } from '@/lib/db';
import { parseVariantsWithLabels } from '@/lib/experiment-repo';
import { analyzeExperimentRow } from '@/lib/stats';
import { summarizeResult } from '@/lib/stats-format';

export default async function ExperimentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experiments = await prisma.experiment.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } });
  const analyses = await Promise.all(experiments.map((experiment) => analyzeExperimentRow(experiment)));

  const rows: ExperimentRow[] = experiments.map((experiment, index) => {
    const { key: baselineKey } = parseVariantsWithLabels(experiment)[0] || {};
    return {
      id: experiment.id,
      key: experiment.key,
      name: experiment.name,
      status: experiment.status,
      conversionEvent: experiment.conversionEvent,
      createdAt: experiment.createdAt.toISOString(),
      result: summarizeResult(analyses[index], baselineKey),
    };
  });

  return <ExperimentsTable projectId={id} experiments={rows} />;
}
