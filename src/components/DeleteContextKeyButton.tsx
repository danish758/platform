'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useApiRequest } from '@/hooks/useApiRequest';

export function DeleteContextKeyButton({ projectId, keyId, contextKey }: { projectId: string; keyId: string; contextKey: string }) {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="link"
        size="sm"
        loading={pending}
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
        className="h-auto p-0 text-destructive"
      >
        Delete
      </Button>
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
