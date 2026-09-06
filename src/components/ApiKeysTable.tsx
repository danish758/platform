'use client';

import { FC, useMemo, useState } from 'react';
import { RevokeApiKeyButton } from '@/components/RevokeApiKeyButton';

export type ApiKeyRow = { id: string; label: string | null; createdAt: string; revokedAt: string | null };

type ApiKeysTableProps = { projectId: string; apiKeys: ApiKeyRow[] };

const TABS = ['Active', 'Revoked'] as const;
type Tab = (typeof TABS)[number];

export const ApiKeysTable: FC<ApiKeysTableProps> = ({ projectId, apiKeys }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Active');
  const [search, setSearch] = useState('');

  const active = useMemo(() => apiKeys.filter((key) => !key.revokedAt), [apiKeys]);
  const revoked = useMemo(() => apiKeys.filter((key) => key.revokedAt), [apiKeys]);
  const currentTabKeys = activeTab === 'Active' ? active : revoked;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return currentTabKeys;
    return currentTabKeys.filter((key) => (key.label ?? '').toLowerCase().includes(query));
  }, [currentTabKeys, search]);

  return (
    <div>
      <div className="flex items-center gap-6 border-b border-slate-200">
        {TABS.map((tab) => {
          const count = tab === 'Active' ? active.length : revoked.length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium ${
                isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{count}</span>
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="mt-4 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Revoked</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  {currentTabKeys.length === 0
                    ? activeTab === 'Active'
                      ? 'No active API keys.'
                      : 'No revoked API keys.'
                    : 'No API keys match.'}
                </td>
              </tr>
            )}
            {filtered.map((key) => (
              <tr key={key.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{key.label || 'Unlabeled key'}</td>
                <td className="px-4 py-3 text-slate-600">{key.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-3 text-slate-600">{key.revokedAt ? key.revokedAt.slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {!key.revokedAt && <RevokeApiKeyButton projectId={projectId} keyId={key.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
