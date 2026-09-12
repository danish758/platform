import { ContextKeysTable } from '@/components/ContextKeysTable';
import { CreateContextKeyForm } from '@/components/CreateContextKeyForm';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { prisma } from '@/lib/db';
import { getProjectName } from '@/lib/project-repo';

export default async function ContextKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contextKeys, projectName] = await Promise.all([
    prisma.contextKey.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } }),
    getProjectName(id),
  ]);

  return (
    <div>
      <PageBreadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: projectName, href: `/projects/${id}` },
          { label: 'Context keys' },
        ]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Context keys</h1>
        <CreateContextKeyForm projectId={id} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        The attribute names your app&apos;s SDK integration actually sends (e.g.{' '}
        <code className="rounded bg-secondary px-1.5 py-0.5">page</code>,{' '}
        <code className="rounded bg-secondary px-1.5 py-0.5">device</code>). Only registered keys can be
        used in an experiment&apos;s targeting rules.
      </p>

      <div className="mt-6">
        <ContextKeysTable projectId={id} contextKeys={contextKeys} />
      </div>
    </div>
  );
}
