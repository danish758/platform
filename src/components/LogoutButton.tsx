'use client';

import { useRouter } from 'next/navigation';
import { useApiRequest } from '@/hooks/useApiRequest';

export function LogoutButton() {
  const router = useRouter();
  const { run, error } = useApiRequest();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={async () => {
          const body = await run('/api/auth/logout', { method: 'POST' }, 'Failed to log out');
          if (!body) return;
          router.push('/login');
          router.refresh();
        }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Log out
      </button>
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
