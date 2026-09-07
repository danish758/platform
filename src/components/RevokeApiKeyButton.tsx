'use client';

import { useRouter } from 'next/navigation';
import { useApiRequest } from '@/hooks/useApiRequest';

export function RevokeApiKeyButton({ projectId, keyId }: { projectId: string; keyId: string }) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          const body = await run(`/api/projects/${projectId}/api-keys/${keyId}`, { method: 'DELETE' }, 'Failed to revoke API key');
          if (!body) return;
          router.refresh();
        }}
        className="text-xs font-medium text-destructive hover:underline disabled:opacity-60"
      >
        {pending ? 'Revoking…' : 'Revoke'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
