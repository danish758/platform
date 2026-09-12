import type { ExperimentStatus } from '@cro-engine/assignment-engine';
import type { SignificanceResult, VariantStats } from '@cro-engine/stats-engine';
import Link from 'next/link';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { StatusBadge } from '@/components/stats/StatusBadge';
import { VariantResultsTable } from '@/components/stats/VariantResultsTable';
import { Card } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { parseVariantsWithLabels } from '@/lib/experiment-repo';
import { getProjectName } from '@/lib/project-repo';
import { analyzeExperimentRow } from '@/lib/stats';

export default async function ProjectDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  const [experiments, projectName] = await Promise.all([
    prisma.experiment.findMany({ where: { projectId }, orderBy: { key: 'asc' } }),
    getProjectName(projectId),
  ]);
  const analyses = await Promise.all(experiments.map((experiment) => analyzeExperimentRow(experiment)));

  return (
    <div>
      <PageBreadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: projectName, href: `/projects/${projectId}` },
          { label: 'Dashboard' },
        ]}
      />
      <h1 className="text-2xl font-bold">Stats dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Visitor/conversion counts are unique users (deduplicated exposures, unique converting users) —
        not raw event counts. The baseline for lift/significance is each experiment&apos;s first-listed
        variant.
      </p>

      <div className="mt-10 space-y-10">
        {experiments.length === 0 && <p className="text-sm text-muted-foreground">No experiments yet.</p>}
        {experiments.map((experiment, index) => {
          const analysis = analyses[index];
          const variants = parseVariantsWithLabels(experiment);
          const { key: baselineKey } = variants[0] || {};
          const labelByKey = Object.fromEntries(variants.map((variant) => [variant.key, variant.label || variant.key]));
          const { results = null, statsByVariant = {} } = analysis || {};
          return (
            <ExperimentCard
              key={experiment.id}
              projectId={projectId}
              status={experiment.status}
              name={experiment.name}
              experimentKey={experiment.key}
              conversionEvent={experiment.conversionEvent}
              baselineKey={baselineKey}
              labelByKey={labelByKey}
              results={results}
              statsByVariant={statsByVariant}
            />
          );
        })}
      </div>
    </div>
  );
}

function ExperimentCard({
  projectId,
  name,
  experimentKey,
  status,
  conversionEvent,
  baselineKey,
  labelByKey,
  results,
  statsByVariant,
}: {
  projectId: string;
  name: string;
  experimentKey: string;
  status: ExperimentStatus;
  conversionEvent: string | null;
  baselineKey: string | undefined;
  labelByKey: Record<string, string>;
  results: SignificanceResult[] | null;
  statsByVariant: Record<string, VariantStats>;
}) {
  return (
    <Card className="p-6">
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            <code className="text-xs text-muted-foreground">{experimentKey}</code>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <Link
              href={`/projects/${projectId}/experiments/${experimentKey}`}
              className="text-xs font-medium text-muted-foreground hover:underline"
            >
              View details →
            </Link>
          </div>
        </div>

        {!conversionEvent && (
          <p className="mt-3 text-xs text-warning">
            No conversion event configured — showing visitor counts only. Set one in the experiment&apos;s
            settings to see significance.
          </p>
        )}

        {!results || results.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No exposures logged yet.</p>
        ) : (
          <div className="mt-6">
            <VariantResultsTable
              results={results}
              statsByVariant={statsByVariant}
              labelByKey={labelByKey}
              baselineKey={baselineKey}
            />
          </div>
        )}
      </section>
    </Card>
  );
}
