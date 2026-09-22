'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useApiRequest } from '@/hooks/useApiRequest';

export function RevokeApiKeyButton({ projectId, keyId }: { projectId: string; keyId: string }) {
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
          const body = await run(`/api/projects/${projectId}/api-keys/${keyId}`, { method: 'DELETE' }, 'Failed to revoke API key');
          if (!body) return;
          router.refresh();
        }}
        className="h-auto p-0 text-destructive"
      >
        Revoke
      </Button>
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
