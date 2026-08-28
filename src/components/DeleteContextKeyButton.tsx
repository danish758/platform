'use client';

import { useRouter } from 'next/navigation';
import { useApiRequest } from '@/hooks/useApiRequest';

export function DeleteContextKeyButton({ projectId, keyId, contextKey }: { projectId: string; keyId: string; contextKey: string }) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!confirm(`Delete context key "${contextKey}"?`)) return;
          const body = await run(
            `/api/projects/${projectId}/context-keys/${keyId}`,
            { method: 'DELETE' },
            'Failed to delete context key'
          );
          if (!body) return;
          router.refresh();
        }}
        className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
      >
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
