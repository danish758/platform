'use client';

import { useRouter } from 'next/navigation';
import { useApiRequest } from '@/hooks/useApiRequest';

export function DeleteExperimentButton({ projectId, experimentKey }: { projectId: string; experimentKey: string }) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!confirm(`Delete "${experimentKey}"? Historical exposure/conversion data is kept, but this config is gone.`)) return;
          const body = await run(
            `/api/projects/${projectId}/experiments/${experimentKey}`,
            { method: 'DELETE' },
            'Failed to delete experiment'
          );
          if (!body) return;
          router.push(`/projects/${projectId}`);
          router.refresh();
        }}
        className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
      >
        {pending ? 'Deleting…' : 'Delete experiment'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
