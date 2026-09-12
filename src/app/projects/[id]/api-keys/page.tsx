import { ApiKeysTable, type ApiKeyRow } from '@/components/ApiKeysTable';
import { CreateApiKeyForm } from '@/components/CreateApiKeyForm';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { prisma } from '@/lib/db';
import { getProjectName } from '@/lib/project-repo';

export default async function ApiKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [apiKeys, projectName] = await Promise.all([
    prisma.apiKey.findMany({ where: { projectId: id }, orderBy: { createdAt: 'desc' } }),
    getProjectName(id),
  ]);

  const rows: ApiKeyRow[] = apiKeys.map((key) => ({
    id: key.id,
    label: key.label,
    createdAt: key.createdAt.toISOString(),
    revokedAt: key.revokedAt ? key.revokedAt.toISOString() : null,
  }));

  return (
    <div>
      <PageBreadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: projectName, href: `/projects/${id}` },
          { label: 'API keys' },
        ]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API keys</h1>
        <CreateApiKeyForm projectId={id} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Used by <code className="rounded bg-secondary px-1.5 py-0.5">@cro-engine/sdk</code> in a consuming
        app to fetch this project&apos;s experiment config and send events.
      </p>

      <div className="mt-6">
        <ApiKeysTable projectId={id} apiKeys={rows} />
      </div>
    </div>
  );
}
