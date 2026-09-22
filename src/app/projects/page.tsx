import { FlaskConical, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { NewProjectDialog } from '@/components/NewProjectDialog';
import { ProjectCardMenu } from '@/components/ProjectCardMenu';
import { getCurrentAccount } from '@/lib/authz';
import { getAvatarColor, getInitials } from '@/lib/avatar-color';
import { prisma } from '@/lib/db';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const account = await getCurrentAccount();
  // Middleware already gates this route; account is non-null in practice.
  // Guarded here too rather than asserting, in case a session expired
  // between the middleware check and this render.
  if (!account) return null;

  const projects = await prisma.project.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { experiments: true, apiKeys: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-5xl overflow-y-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {projects.length} project{projects.length === 1 ? '' : 's'}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No projects yet.</p>
          <div className="flex justify-center">
            <NewProjectDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex min-h-[132px] flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring/40"
            >
              <ProjectCardMenu projectId={project.id} projectName={project.name} />

              <Link href={`/projects/${project.id}`} className="flex flex-1 flex-col">
                <div className="flex items-center gap-3 pr-16">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white',
                      getAvatarColor(project.id)
                    )}
                  >
                    {getInitials(project.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{project.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                      Created {project.createdAt.toISOString().slice(0, 10)}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{project._count.experiments}</span> experiment
                    {project._count.experiments === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{project._count.apiKeys}</span> API key
                    {project._count.apiKeys === 1 ? '' : 's'}
                  </span>
                </div>
              </Link>
            </div>
          ))}

          <NewProjectDialog />
        </div>
      )}
    </main>
  );
}
