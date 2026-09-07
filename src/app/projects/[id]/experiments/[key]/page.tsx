import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/stats/StatusBadge';
import { VariantResultsTable } from '@/components/stats/VariantResultsTable';
import { getExperimentRow, parseVariantsWithLabels } from '@/lib/experiment-repo';
import { analyzeExperimentRow } from '@/lib/stats';

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string; key: string }>;
}) {
  const { id: projectId, key } = await params;
  const row = await getExperimentRow(projectId, key);
  if (!row) notFound();

  const analysis = await analyzeExperimentRow(row);
  const variants = parseVariantsWithLabels(row);
  const { key: baselineKey } = variants[0] || {};
  const labelByKey = Object.fromEntries(variants.map((variant) => [variant.key, variant.label || variant.key]));
  const { results = null, statsByVariant = {} } = analysis || {};

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{row.name}</h1>
          <code className="text-xs text-muted-foreground">{row.key}</code>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={row.status} />
          <Link
            href={`/projects/${projectId}/experiments/${key}/edit`}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Edit
          </Link>
        </div>
      </div>

      {!row.conversionEvent && (
        <p className="mt-3 text-xs text-warning">
          No conversion event configured — showing visitor counts only. Set one in the experiment&apos;s
          settings to see significance.
        </p>
      )}

      {!results || results.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No exposures logged yet.</p>
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
    </div>
  );
}
