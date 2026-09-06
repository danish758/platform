import { ContextKeysTable } from '@/components/ContextKeysTable';
import { CreateContextKeyForm } from '@/components/CreateContextKeyForm';
import { prisma } from '@/lib/db';

export default async function ContextKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextKeys = await prisma.contextKey.findMany({ where: { projectId: id }, orderBy: { key: 'asc' } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Context keys</h1>
        <CreateContextKeyForm projectId={id} />
      </div>
      <p className="mt-1 text-sm text-slate-600">
        The attribute names your app&apos;s SDK integration actually sends (e.g.{' '}
        <code className="rounded bg-slate-200 px-1.5 py-0.5">page</code>,{' '}
        <code className="rounded bg-slate-200 px-1.5 py-0.5">device</code>). Only registered keys can be
        used in an experiment&apos;s targeting rules.
      </p>

      <div className="mt-6">
        <ContextKeysTable projectId={id} contextKeys={contextKeys} />
      </div>
    </div>
  );
}
