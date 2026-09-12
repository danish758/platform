import { ExperimentWizard } from '@/components/ExperimentWizard';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { prisma } from '@/lib/db';
import { getProjectName } from '@/lib/project-repo';

export default async function NewExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contextKeys, projectName] = await Promise.all([
    prisma.contextKey.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } }),
    getProjectName(id),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-2xl px-6 pt-8">
        <PageBreadcrumb
          items={[
            { label: 'Projects', href: '/projects' },
            { label: projectName, href: `/projects/${id}` },
            { label: 'Experiments', href: `/projects/${id}/experiments` },
            { label: 'New experiment' },
          ]}
        />
      </div>
      <ExperimentWizard projectId={id} mode="create" contextKeys={contextKeys} />
    </div>
  );
}
