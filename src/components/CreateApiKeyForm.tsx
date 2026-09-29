'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useZodForm } from '@/hooks/useZodForm';
import { createApiKeySchema } from '@/lib/validation/api-key';
import { LABEL_MAX } from '@/lib/validation/limits';

export function CreateApiKeyForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, formState, assignServerErrors } = useZodForm(createApiKeySchema, {
    defaultValues: { label: '' },
  });
  const { errors } = formState;
  const { run, pending, error, clearErrors } = useApiRequest();

  const onSubmit = handleSubmit(async (values) => {
    const body = await run<{ key: string }>(
      `/api/projects/${projectId}/api-keys`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) },
      'Failed to create API key',
      assignServerErrors
    );
    if (!body) return;

    setCreatedKey(body.key);
    reset();
    router.refresh();
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setCreatedKey(null);
      reset();
      clearErrors();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">New API key</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
          <DialogTitle className="text-2xl">New API key</DialogTitle>
        </DialogHeader>

        {createdKey ? (
          <div className="flex-1 overflow-y-auto px-10 py-6">
            <div className="rounded-md border border-warning/40 bg-warning/10 p-4">
              <p className="text-sm font-medium text-warning">Copy this key now — it won&apos;t be shown again.</p>
              <code className="mt-2 block break-all rounded bg-card px-3 py-2 text-sm">{createdKey}</code>
              <Button type="button" className="mt-3" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
              <FormField
                id="new-api-key-label"
                label="Label"
                error={errors.label}
                counter={{ value: watch('label'), max: LABEL_MAX }}
                help="Where this key is used, so you can tell keys apart later."
              >
                <Input {...register('label')} placeholder="e.g. production" autoFocus className="mt-2" />
              </FormField>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
              <Button type="submit" size="lg" loading={pending}>
                Create API key
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
