'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RevokeApiKeyButton({ projectId, keyId }: { projectId: string; keyId: string }) {
  const router = useRouter();
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={revoking}
        onClick={async () => {
          setRevoking(true);
          setError(null);
          const res = await fetch(`/api/projects/${projectId}/api-keys/${keyId}`, { method: 'DELETE' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const { errors = [], error: errorMessage } = body;
            setError(errors[0] ?? errorMessage ?? 'Failed to revoke API key');
            setRevoking(false);
            return;
          }
          router.refresh();
        }}
        className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
      >
        {revoking ? 'Revoking…' : 'Revoke'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
