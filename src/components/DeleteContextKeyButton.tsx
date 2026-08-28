'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteContextKeyButton({ projectId, keyId, contextKey }: { projectId: string; keyId: string; contextKey: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!confirm(`Delete context key "${contextKey}"?`)) return;
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/projects/${projectId}/context-keys/${keyId}`, { method: 'DELETE' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setError(body.errors?.[0] ?? body.error ?? 'Failed to delete context key');
            setBusy(false);
            return;
          }
          router.refresh();
        }}
        className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
      >
        {busy ? 'Deleting…' : 'Delete'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
