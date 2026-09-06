import Link from 'next/link';
import { DeleteProjectButton } from '@/components/DeleteProjectButton';
import { prisma } from '@/lib/db';

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUniqueOrThrow({ where: { id } });
  const [experimentCount, apiKeyCount, contextKeyCount] = await Promise.all([
    prisma.experiment.count({ where: { projectId: id } }),
    prisma.apiKey.count({ where: { projectId: id } }),
    prisma.contextKey.count({ where: { projectId: id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Created {project.createdAt.toISOString().slice(0, 10)}</p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <StatCard label="Experiments" value={experimentCount} href={`/projects/${id}/experiments`} />
        <StatCard label="API keys" value={apiKeyCount} href={`/projects/${id}/api-keys`} />
        <StatCard label="Context keys" value={contextKeyCount} href={`/projects/${id}/context-keys`} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-rose-700">Danger zone</h2>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-5">
          <div>
            <div className="font-medium text-rose-900">Delete this project</div>
            <p className="mt-1 text-sm text-rose-700">
              Permanently deletes this project and all of its experiments, API keys, context keys,
              exposures, and conversions.
            </p>
          </div>
          <DeleteProjectButton projectId={id} projectName={project.name} redirectTo="/projects" />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </Link>
  );
}
