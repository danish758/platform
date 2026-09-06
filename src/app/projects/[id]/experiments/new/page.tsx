import { ExperimentWizard } from '@/components/ExperimentWizard';
import { prisma } from '@/lib/db';

export default async function NewExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextKeys = await prisma.contextKey.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } });

  return <ExperimentWizard projectId={id} mode="create" contextKeys={contextKeys} />;
}
