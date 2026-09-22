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
  const [{ id }, account] = await Promise.all([params, getCurrentAccount()]);
  if (!account) return null;

  // The sidebar list needs only the account, not the ownership check, so both
  // queries go out together rather than chaining.
  const [project, projects] = await Promise.all([
    requireOwnedProject(account.id, id),
    prisma.project.findMany({
      where: { accountId: account.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  if (!project) notFound();

  return (
    <div className="flex flex-1 overflow-hidden">
      <ProjectSidebar projectId={id} projectName={project.name} projects={projects} />
      <main className="flex-1 overflow-y-auto bg-background p-8">{children}</main>
    </div>
  );
}
