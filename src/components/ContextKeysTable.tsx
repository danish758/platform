'use client';

import { FC, useMemo, useState } from 'react';
import { DeleteContextKeyButton } from '@/components/DeleteContextKeyButton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="max-w-sm"
      />

      <div className="mt-4">
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {contextKeys.length === 0 ? 'No context keys yet.' : 'No context keys match.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((contextKey) => (
              <TableRow key={contextKey.id}>
                <TableCell className="font-mono font-medium">{contextKey.key}</TableCell>
                <TableCell className="text-muted-foreground">{contextKey.label || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{contextKey.type}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DeleteContextKeyButton projectId={projectId} keyId={contextKey.id} contextKey={contextKey.key} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
