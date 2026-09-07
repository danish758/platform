'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiRequest } from '@/hooks/useApiRequest';

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const { run, pending, error } = useApiRequest();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = await run(
      '/api/projects',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) },
      'Failed to create project'
    );
    if (!body) return;

    setName('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <Label>New project name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Marketing Site" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create project'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
