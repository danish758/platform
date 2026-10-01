'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useZodForm } from '@/hooks/useZodForm';
import { experimentKeyFromName } from '@/lib/experiment-form';
import { createExperimentSchema } from '@/lib/validation/experiment';
import { DESCRIPTION_MAX, EXPERIMENT_KEY_MAX, EXPERIMENT_NAME_MAX } from '@/lib/validation/limits';

const formSchema = createExperimentSchema.pick({ name: true, key: true, description: true });

export function CreateExperimentDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keyEdited, setKeyEdited] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState, assignServerErrors } = useZodForm(formSchema, {
    defaultValues: { name: '', key: '', description: '' },
  });
  const { errors, touchedFields } = formState;
  const { run, pending, error, clearErrors } = useApiRequest();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setKeyEdited(false);
      clearErrors();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const body = await run<{ experiment: { key: string } }>(
      `/api/projects/${projectId}/experiments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          status: 'draft',
          conversionEvent: '',
          variants: [
            { key: 'control', weight: 50, label: 'Control' },
            { key: 'variant', weight: 50, label: 'Variant' },
          ],
          targeting: [],
        }),
      },
      'Failed to create experiment',
      assignServerErrors
    );
    if (!body) return;

    handleOpenChange(false);
    router.push(`/projects/${projectId}/experiments/${values.key}`);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">New experiment</Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
          <DialogTitle className="text-2xl">New experiment</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
            <FormField
              id="new-experiment-name"
              label="Name"
              error={errors.name}
              counter={{ value: watch('name'), max: EXPERIMENT_NAME_MAX }}
            >
              <Input
                {...register('name', {
                  onChange: (e) => {
                    if (keyEdited) return;
                    // Only re-validate the derived key once it has been shown to the user as touched.
                    setValue('key', experimentKeyFromName(e.target.value), { shouldValidate: Boolean(touchedFields.key) });
                  },
                })}
                placeholder="e.g. Homepage CTA copy"
                autoFocus
                className="mt-2"
              />
            </FormField>
            <FormField
              id="new-experiment-key"
              label="Key"
              error={errors.key}
              counter={{ value: watch('key'), max: EXPERIMENT_KEY_MAX }}
              help="Used by the SDK to look up this experiment. Lowercase letters and numbers, separated by hyphens."
            >
              <Input {...register('key', { onChange: () => setKeyEdited(true) })} className="mt-2 font-mono" />
            </FormField>
            <FormField
              id="new-experiment-description"
              label="Description"
              optional
              error={errors.description}
              counter={{ value: watch('description') ?? '', max: DESCRIPTION_MAX }}
            >
              <Textarea {...register('description')} className="mt-2" rows={3} />
            </FormField>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-3 border-t border-border px-10 py-6">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" loading={pending}>
              Create experiment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
