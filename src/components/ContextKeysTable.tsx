'use client';

import { FC, useMemo, useState } from 'react';
import { DeleteContextKeyButton } from '@/components/DeleteContextKeyButton';

export type ContextKeyRow = { id: string; key: string; label: string | null; type: string };

type ContextKeysTableProps = { projectId: string; contextKeys: ContextKeyRow[] };

export const ContextKeysTable: FC<ContextKeysTableProps> = ({ projectId, contextKeys }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contextKeys;
    return contextKeys.filter(
      (contextKey) =>
        contextKey.key.toLowerCase().includes(query) || (contextKey.label ?? '').toLowerCase().includes(query)
    );
  }, [contextKeys, search]);

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  {contextKeys.length === 0 ? 'No context keys yet.' : 'No context keys match.'}
                </td>
              </tr>
            )}
            {filtered.map((contextKey) => (
              <tr key={contextKey.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-medium">{contextKey.key}</td>
                <td className="px-4 py-3 text-slate-600">{contextKey.label || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {contextKey.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteContextKeyButton projectId={projectId} keyId={contextKey.id} contextKey={contextKey.key} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
