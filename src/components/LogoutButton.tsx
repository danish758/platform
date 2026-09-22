'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useApiRequest } from '@/hooks/useApiRequest';

export function LogoutButton() {
  const router = useRouter();
  const { run, pending, error } = useApiRequest();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="link"
        loading={pending}
        onClick={async () => {
          const body = await run('/api/auth/logout', { method: 'POST' }, 'Failed to log out');
          if (!body) return;
          router.push('/login');
          router.refresh();
        }}
        className="h-auto p-0 text-muted-foreground hover:text-foreground hover:no-underline"
      >
        Log out
      </Button>
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
