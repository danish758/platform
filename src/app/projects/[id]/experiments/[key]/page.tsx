import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExperimentStatusControl } from '@/components/ExperimentStatusControl';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { DailyExposuresChart } from '@/components/experiment-detail/DailyExposuresChart';
import { DiagnosticsBanner } from '@/components/experiment-detail/DiagnosticsBanner';
import { ObservedSplitBar } from '@/components/experiment-detail/ObservedSplitBar';
import { StatRow } from '@/components/experiment-detail/StatRow';
import { TrafficAllocationFlow } from '@/components/experiment-detail/TrafficAllocationFlow';
import { StatusIndicator } from '@/components/stats/StatusIndicator';
import { VariantResultsChart } from '@/components/stats/VariantResultsChart';
import { VariantResultsTable } from '@/components/stats/VariantResultsTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDailyExposureSeries } from '@/lib/daily-exposures';
import { prisma } from '@/lib/db';
import { getExperimentRow, parseVariantsWithLabels, toConfig } from '@/lib/experiment-repo';
import { getProjectName } from '@/lib/project-repo';
import { sampleProgress } from '@/lib/stats-format';
import { analyzeExperimentRow } from '@/lib/stats';
import { checkSampleRatioMismatch } from '@/lib/srm';

const CHART_MAX_DAYS = 30;

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

  const config = toConfig(row);
  const [contextKeys, projectName] = await Promise.all([
    prisma.contextKey.findMany({ where: { projectId } }),
    getProjectName(projectId),
  ]);
  const labelByAttribute = Object.fromEntries(contextKeys.map((contextKey) => [contextKey.key, contextKey.label || contextKey.key]));

  const observedVisitors = Object.fromEntries(
    Object.entries(statsByVariant).map(([variantKey, stat]) => [variantKey, stat.visitors])
  );
  const totalVisitors = Object.values(observedVisitors).reduce((sum, count) => sum + count, 0);
  const srm = checkSampleRatioMismatch(
    variants.map((variant) => ({ key: variant.key, weight: variant.weight })),
    observedVisitors
  );

  const progress = analysis ? sampleProgress(analysis, baselineKey) : null;

  const rangeEnd = row.stoppedAt ?? new Date();
  const earliestStart = row.startedAt ?? row.createdAt;
  const cappedRangeStart = new Date(Math.max(earliestStart.getTime(), rangeEnd.getTime() - CHART_MAX_DAYS * 86_400_000));
  const dailySeries = await getDailyExposureSeries(
    projectId,
    key,
    variants.map((variant) => variant.key),
    cappedRangeStart,
    rangeEnd
  );
  const daysElapsed = Math.max(1, Math.round((rangeEnd.getTime() - earliestStart.getTime()) / 86_400_000));
  const dailyVisitorRate = row.startedAt ? totalVisitors / daysElapsed : null;

  return (
    <div>
      <PageBreadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: projectName, href: `/projects/${projectId}` },
          { label: 'Experiments', href: `/projects/${projectId}/experiments` },
          { label: row.name },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{row.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-xs text-muted-foreground">{row.key}</code>
            <span className="text-border">·</span>
            <StatusIndicator status={row.status} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/experiments/${key}/edit`}>Edit</Link>
          </Button>
          <ExperimentStatusControl
            variant="action"
            projectId={projectId}
            experimentKey={key}
            experimentName={row.name}
            status={row.status}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {row.description && (
            <Card>
              <CardContent>
                <p className="mb-2 text-sm font-semibold">Description</p>
                <p className="text-sm text-muted-foreground">{row.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <p className="mb-1 text-sm font-semibold">Traffic Allocation</p>
              <p className="mb-4 text-xs text-muted-foreground">
                How visitors are targeted and split across variants
              </p>
              <TrafficAllocationFlow
                targeting={config.targeting ?? []}
                labelByAttribute={labelByAttribute}
                variants={variants.map((variant) => ({
                  key: variant.key,
                  label: variant.label || variant.key,
                  weight: variant.weight,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="mb-3 text-sm font-semibold">Experiment info</p>
              <dl className="divide-y divide-border text-sm">
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Primary metric</dt>
                  <dd className="font-mono">{row.conversionEvent || 'none (visitor counts only)'}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-mono tabular-nums">{row.createdAt.toISOString().slice(0, 10)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Started</dt>
                  <dd className="font-mono tabular-nums">
                    {row.startedAt ? row.startedAt.toISOString().slice(0, 10) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Stopped</dt>
                  <dd className="font-mono tabular-nums">
                    {row.stoppedAt ? row.stoppedAt.toISOString().slice(0, 10) : '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <StatRow
            totalVisitors={totalVisitors}
            sampleProgressPercent={progress?.percent ?? null}
            dailyVisitorRate={dailyVisitorRate}
            diagnosticsCount={srm?.isMismatched ? 1 : 0}
          />

          {srm?.isMismatched && <DiagnosticsBanner srm={srm} variantLabelByKey={labelByKey} />}

          {!row.conversionEvent && (
            <p className="text-xs text-warning">
              No conversion event configured — showing visitor counts only. Set one in the experiment&apos;s
              settings to see significance.
            </p>
          )}

          {totalVisitors > 0 && (
            <Card>
              <CardContent>
                <p className="mb-1 text-sm font-semibold">Daily exposures</p>
                <p className="mb-4 text-xs text-muted-foreground">Visitors assigned per variant, per day</p>
                <DailyExposuresChart
                  series={dailySeries}
                  variants={variants.map((variant) => ({ key: variant.key, label: variant.label || variant.key }))}
                />
              </CardContent>
            </Card>
          )}

          {!results || results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exposures logged yet.</p>
          ) : (
            <Card>
              <CardContent>
                <p className="mb-1 text-sm font-semibold">Results</p>
                <p className="mb-5 text-xs text-muted-foreground">Conversion rate with 95% confidence interval</p>
                <VariantResultsChart
                  results={results}
                  statsByVariant={statsByVariant}
                  labelByKey={labelByKey}
                  baselineKey={baselineKey}
                />
                <div className="my-6 border-t border-border" />
                <VariantResultsTable
                  results={results}
                  statsByVariant={statsByVariant}
                  labelByKey={labelByKey}
                  baselineKey={baselineKey}
                />
              </CardContent>
            </Card>
          )}

          {totalVisitors > 0 && (
            <Card>
              <CardContent>
                <p className="mb-3 text-sm font-semibold">Observed traffic split</p>
                <ObservedSplitBar
                  variants={variants.map((variant) => ({ key: variant.key, label: variant.label || variant.key }))}
                  observedVisitors={observedVisitors}
                  isMismatched={srm?.isMismatched ?? false}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
