'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApiRequest } from '@/hooks/useApiRequest';

export function CreateContextKeyForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'string' | 'number'>('string');
  const { run, pending, error } = useApiRequest();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = await run(
      `/api/projects/${projectId}/context-keys`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, label, type }) },
      'Failed to create context key'
    );
    if (!body) return;

    setKey('');
    setLabel('');
    setType('string');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700">Key</label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. page"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700">Label (optional)</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Page path"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'string' | 'number')}
          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="string">string</option>
          <option value="number">number</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending || !key}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Creating…' : 'New context key'}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  );
}
