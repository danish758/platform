import { notFound } from 'next/navigation';
import { ExperimentWizard } from '@/components/ExperimentWizard';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';

export default async function NewExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getCurrentAccount();
  if (!account) return null;

  const project = await requireOwnedProject(account.id, id);
  if (!project) notFound();

  const contextKeys = await prisma.contextKey.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } });

  return <ExperimentWizard projectId={id} mode="create" contextKeys={contextKeys} />;
}
