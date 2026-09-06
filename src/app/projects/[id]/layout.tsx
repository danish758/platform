import { notFound } from 'next/navigation';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getCurrentAccount();
  if (!account) return null;

  const project = await requireOwnedProject(account.id, id);
  if (!project) notFound();

  const projects = await prisma.project.findMany({
    where: { accountId: account.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="flex min-h-screen">
      <ProjectSidebar projectId={id} projectName={project.name} projects={projects} />
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}
