import Link from 'next/link';
import { CreateProjectForm } from '@/components/CreateProjectForm';
import { DeleteProjectButton } from '@/components/DeleteProjectButton';
import { LogoutButton } from '@/components/LogoutButton';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentAccount } from '@/lib/authz';
import { prisma } from '@/lib/db';

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
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
        </div>
        <LogoutButton />
      </div>

      <Card className="mt-8">
        <CardContent>
          <CreateProjectForm />
        </CardContent>
      </Card>

      <div className="mt-8 space-y-3">
        {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
        {projects.map((project) => (
          <Card key={project.id} className="flex items-center justify-between gap-4 p-5 hover:border-ring/40">
            <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
              <div className="font-semibold">{project.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {project._count.experiments} experiment{project._count.experiments === 1 ? '' : 's'} ·{' '}
                {project._count.apiKeys} API key{project._count.apiKeys === 1 ? '' : 's'}
              </div>
            </Link>
            <DeleteProjectButton projectId={project.id} projectName={project.name} />
          </Card>
        ))}
      </div>
    </main>
  );
}
