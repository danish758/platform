'use client';

import { FC, useMemo, useState } from 'react';
import { RevokeApiKeyButton } from '@/components/RevokeApiKeyButton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <div className="flex items-center gap-6 border-b border-border">
        {TABS.map((tab) => {
          const count = tab === 'Active' ? active.length : revoked.length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="mt-4 max-w-sm"
      />

      <div className="mt-4">
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Revoked</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {currentTabKeys.length === 0
                    ? activeTab === 'Active'
                      ? 'No active API keys.'
                      : 'No revoked API keys.'
                    : 'No API keys match.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.label || 'Unlabeled key'}</TableCell>
                <TableCell className="text-muted-foreground">{key.createdAt.slice(0, 10)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {key.revokedAt ? key.revokedAt.slice(0, 10) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {!key.revokedAt && <RevokeApiKeyButton projectId={projectId} keyId={key.id} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
