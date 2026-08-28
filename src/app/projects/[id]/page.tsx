import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CreateApiKeyForm } from '@/components/CreateApiKeyForm';
import { CreateContextKeyForm } from '@/components/CreateContextKeyForm';
import { DeleteContextKeyButton } from '@/components/DeleteContextKeyButton';
import { RevokeApiKeyButton } from '@/components/RevokeApiKeyButton';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getCurrentAccount();
  if (!account) return null;

  const project = await requireOwnedProject(account.id, id);
  if (!project) notFound();

  const [apiKeys, experiments, contextKeys] = await Promise.all([
    prisma.apiKey.findMany({ where: { projectId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.experiment.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } }),
    prisma.contextKey.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/projects" className="text-sm text-slate-500 hover:underline">
        ← All projects
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Link
          href={`/projects/${id}/dashboard`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
        >
          View stats dashboard
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">API keys</h2>
        <p className="mt-1 text-sm text-slate-600">
          Used by <code className="rounded bg-slate-200 px-1.5 py-0.5">@cro-engine/sdk</code> in a
          consuming app to fetch this project&apos;s experiment config and send events.
        </p>

        <div className="mt-4 space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{key.label || 'Unlabeled key'}</span>
                <span className="ml-2 text-slate-400">
                  created {key.createdAt.toISOString().slice(0, 10)}
                </span>
                {key.revokedAt && <span className="ml-2 text-rose-600">revoked</span>}
              </div>
              {!key.revokedAt && <RevokeApiKeyButton projectId={id} keyId={key.id} />}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
          <CreateApiKeyForm projectId={id} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Context keys</h2>
        <p className="mt-1 text-sm text-slate-600">
          The attribute names your app&apos;s SDK integration actually sends (e.g.{' '}
          <code className="rounded bg-slate-200 px-1.5 py-0.5">page</code>,{' '}
          <code className="rounded bg-slate-200 px-1.5 py-0.5">device</code>). Only registered keys
          can be used in an experiment&apos;s targeting rules.
        </p>

        <div className="mt-4 space-y-2">
          {contextKeys.length === 0 && <p className="text-sm text-slate-500">No context keys yet.</p>}
          {contextKeys.map((contextKey) => (
            <div
              key={contextKey.id}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <div>
                <span className="font-mono font-medium">{contextKey.key}</span>
                {contextKey.label && <span className="ml-2 text-slate-500">{contextKey.label}</span>}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{contextKey.type}</span>
              </div>
              <DeleteContextKeyButton projectId={id} keyId={contextKey.id} contextKey={contextKey.key} />
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
          <CreateContextKeyForm projectId={id} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Experiments</h2>
          <Link
            href={`/projects/${id}/experiments/new`}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          >
            New experiment
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          {experiments.length === 0 && <p className="text-sm text-slate-500">No experiments yet.</p>}
          {experiments.map((experiment) => (
            <Link
              key={experiment.id}
              href={`/projects/${id}/experiments/${experiment.key}/edit`}
              className="block rounded-md border border-slate-200 bg-white px-4 py-3 text-sm hover:border-slate-300"
            >
              <span className="font-medium">{experiment.name}</span>
              <span className="ml-2 text-slate-400">{experiment.key}</span>
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{experiment.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
