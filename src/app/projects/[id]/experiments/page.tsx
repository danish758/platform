import { ExperimentsTable, type ExperimentRow } from '@/components/ExperimentsTable';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { prisma } from '@/lib/db';
import { parseVariantsWithLabels } from '@/lib/experiment-repo';
import { getProjectName } from '@/lib/project-repo';
import { analyzeExperimentRow } from '@/lib/stats';
import { summarizeResult } from '@/lib/stats-format';

export default async function ExperimentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [experiments, projectName] = await Promise.all([
    prisma.experiment.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } }),
    getProjectName(id),
  ]);
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

  return (
    <div>
      <PageBreadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: projectName, href: `/projects/${id}` },
          { label: 'Experiments' },
        ]}
      />
      <ExperimentsTable projectId={id} experiments={rows} />
    </div>
  );
}
