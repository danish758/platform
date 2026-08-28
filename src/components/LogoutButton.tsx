'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={async () => {
          setError(null);
          const res = await fetch('/api/auth/logout', { method: 'POST' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const { errors = [], error: errorMessage } = body;
            setError(errors[0] ?? errorMessage ?? 'Failed to log out');
            return;
          }
          router.push('/login');
          router.refresh();
        }}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        Log out
      </button>
      {error && <p className="max-w-xs text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
