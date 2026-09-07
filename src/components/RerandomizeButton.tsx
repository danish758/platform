'use client';

import { useRouter } from 'next/navigation';
import { useApiRequest } from '@/hooks/useApiRequest';

export function RerandomizeButton({
  projectId,
  experimentKey,
  currentSeed,
}: {
  projectId: string;
  experimentKey: string;
  currentSeed: number;
}) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!confirm('Re-randomize this experiment? Every user\'s sticky assignment will be recomputed.')) return;
          const body = await run(
            `/api/projects/${projectId}/experiments/${experimentKey}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ seed: currentSeed + 1 }),
            },
            'Failed to re-randomize experiment'
          );
          if (!body) return;
          router.refresh();
        }}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-60"
      >
        {pending ? 'Re-randomizing…' : 'Force re-randomize'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
