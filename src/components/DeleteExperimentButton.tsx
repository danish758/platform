'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteExperimentButton({ projectId, experimentKey }: { projectId: string; experimentKey: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!confirm(`Delete "${experimentKey}"? Historical exposure/conversion data is kept, but this config is gone.`)) return;
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/projects/${projectId}/experiments/${experimentKey}`, { method: 'DELETE' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const { errors = [], error: errorMessage } = body;
            setError(errors[0] ?? errorMessage ?? 'Failed to delete experiment');
            setBusy(false);
            return;
          }
          router.push(`/projects/${projectId}`);
          router.refresh();
        }}
        className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
      >
        {busy ? 'Deleting…' : 'Delete experiment'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
