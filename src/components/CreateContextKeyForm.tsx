'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useZodForm } from '@/hooks/useZodForm';
import { createContextKeySchema } from '@/lib/validation/context-key';
import { CONTEXT_KEY_MAX, LABEL_MAX } from '@/lib/validation/limits';

const DEFAULT_VALUES = { key: '', label: '', type: 'string' } as const;

export function CreateContextKeyForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, control, formState, assignServerErrors } = useZodForm(
    createContextKeySchema,
    { defaultValues: DEFAULT_VALUES }
  );
  const { errors } = formState;
  const { run, pending, error, clearErrors } = useApiRequest();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(DEFAULT_VALUES);
      clearErrors();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const body = await run(
      `/api/projects/${projectId}/context-keys`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) },
      'Failed to create context key',
      assignServerErrors
    );
    if (!body) return;

    handleOpenChange(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">New context key</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
          <DialogTitle className="text-2xl">New context key</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
            <FormField
              id="new-context-key-key"
              label="Key"
              error={errors.key}
              counter={{ value: watch('key'), max: CONTEXT_KEY_MAX }}
              help="The attribute name your SDK integration sends. Lowercase letters, numbers, and underscores."
            >
              <Input {...register('key')} placeholder="e.g. page" autoFocus className="mt-2 font-mono" />
            </FormField>
            <FormField
              id="new-context-key-label"
              label="Label"
              error={errors.label}
              counter={{ value: watch('label'), max: LABEL_MAX }}
            >
              <Input {...register('label')} placeholder="e.g. Page path" className="mt-2" />
            </FormField>
            <FormField id="new-context-key-type" label="Type" error={errors.type}>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
            <Button type="submit" size="lg" loading={pending}>
              Create context key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
