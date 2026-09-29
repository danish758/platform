'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useZodForm } from '@/hooks/useZodForm';
import { updateExperimentSchema } from '@/lib/validation/experiment';
import { CONVERSION_EVENT_MAX, DESCRIPTION_MAX, EXPERIMENT_NAME_MAX } from '@/lib/validation/limits';

// The PATCH route treats an absent name as "unchanged"; this form always
// sends one, so here it's required.
const formSchema = updateExperimentSchema
  .pick({ name: true, description: true, conversionEvent: true })
  .required({ name: true });

export function BasicsCard({
  projectId,
  experimentKey,
  name,
  description,
  conversionEvent,
}: {
  projectId: string;
  experimentKey: string;
  name: string;
  description: string;
  conversionEvent: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, formState, assignServerErrors } = useZodForm(formSchema, {
    defaultValues: { name, description, conversionEvent },
  });
  const { errors } = formState;
  const { run, pending, error, clearErrors } = useApiRequest();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Re-seed from the current server values every time the dialog opens —
      // Radix doesn't unmount on close, so without this a discarded edit
      // from a previous open would still be sitting in the form.
      reset({ name, description, conversionEvent });
      clearErrors();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const body = await run(
      `/api/projects/${projectId}/experiments/${experimentKey}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) },
      'Failed to save changes',
      assignServerErrors
    );
    if (!body) return;
    setOpen(false);
    router.refresh();
  });

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold">Basics</p>
            <p className="mb-4 text-xs text-muted-foreground">Name, description, and how conversions are tracked.</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Edit basics">
                <Pencil />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0"
              showCloseButton={false}
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader className="shrink-0 border-b border-border px-10 py-6">
                <DialogTitle className="text-2xl">Edit basics</DialogTitle>
              </DialogHeader>

              <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-6 overflow-y-auto px-10 py-6">
                  <FormField
                    id="edit-experiment-name"
                    label="Name"
                    error={errors.name}
                    counter={{ value: watch('name'), max: EXPERIMENT_NAME_MAX }}
                  >
                    <Input {...register('name')} autoFocus className="mt-2" />
                  </FormField>
                  <FormField
                    id="edit-experiment-description"
                    label="Description"
                    optional
                    error={errors.description}
                    counter={{ value: watch('description') ?? '', max: DESCRIPTION_MAX }}
                  >
                    <Textarea {...register('description')} className="mt-2" rows={3} />
                  </FormField>
                  <FormField
                    id="edit-experiment-conversion-event"
                    label="Conversion event"
                    optional
                    error={errors.conversionEvent}
                    counter={{ value: watch('conversionEvent') ?? '', max: CONVERSION_EVENT_MAX }}
                    help={
                      <>
                        The event name your app sends via <code>client.trackConversion()</code> for this
                        experiment&apos;s goal. Lowercase letters, numbers, &quot;_&quot;, &quot;.&quot; and
                        &quot;-&quot;. Leave blank to only track visitor counts.
                      </>
                    }
                  >
                    <Input
                      {...register('conversionEvent')}
                      className="mt-2 font-mono"
                      placeholder="e.g. purchase_completed"
                    />
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
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description || 'No description'}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Conversion event:{' '}
          <span className="font-mono text-foreground">{conversionEvent || 'none (visitor counts only)'}</span>
        </p>
      </CardContent>
    </Card>
  );
}
