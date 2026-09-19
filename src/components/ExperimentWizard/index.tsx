'use client';

import { validateConfig, type ExperimentConfig } from '@cro-engine/assignment-engine';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useApiRequest } from '@/hooks/useApiRequest';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BasicsStep } from './BasicsStep';
import { ReviewStep } from './ReviewStep';
import { StepRail } from './StepRail';
import { TargetingStep } from './TargetingStep';
import type { ContextKeySummary, ExperimentFormValues, ExperimentInitialData } from './types';
import { coerceTargetingRow, newId } from './utils';
import { VariantsStep } from './VariantsStep';
import { WizardNav } from './WizardNav';

export type { ExperimentInitialData };

const STEPS = [
  {
    label: 'Basics',
    description: 'Name, key, and description',
    cardDescription: "Set the experiment's name, key, and how it's tracked.",
  },
  {
    label: 'Variants',
    description: 'Traffic split across variants',
    cardDescription: 'Define the variants users will be bucketed into and their traffic split.',
  },
  {
    label: 'Targeting',
    description: 'Who is eligible to see this',
    cardDescription: "Optional. Rules are AND'd together — everyone is eligible if you skip this step.",
  },
  {
    label: 'Review',
    description: 'Confirm and save',
    cardDescription: 'Double-check everything below before saving.',
  },
] as const;

function toDefaultValues(initial: ExperimentInitialData | undefined, mode: 'create' | 'edit'): ExperimentFormValues {
  const {
    name = '',
    key = '',
    description = '',
    conversionEvent = '',
    status = 'draft',
    variants = [
      { id: newId(), key: 'control', keyEdited: true, weight: 50, label: 'Control' },
      { id: newId(), key: 'variant', keyEdited: true, weight: 50, label: 'Variant' },
    ],
    targeting = [],
  } = initial || {};

  return { name, key, keyEdited: mode === 'edit', description, conversionEvent, status, variants, targeting };
}

export function ExperimentWizard({
  projectId,
  mode,
  initial,
  contextKeys,
  headerActions,
}: {
  projectId: string;
  mode: 'create' | 'edit';
  initial?: ExperimentInitialData;
  contextKeys: ContextKeySummary[];
  headerActions?: ReactNode;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { run, pending, errors: serverErrors } = useApiRequest();
  const form = useForm<ExperimentFormValues>({ defaultValues: toDefaultValues(initial, mode) });
  const { watch } = form;

  const { key: initialKey = '' } = initial || {};

  const name = watch('name');
  const key = watch('key');
  const status = watch('status');
  const variants = watch('variants');
  const targeting = watch('targeting');

  const clientConfig: ExperimentConfig = {
    key: key || 'placeholder',
    status,
    variants: variants.map((variant) => ({ key: variant.key, weight: variant.weight })),
  };
  // Live feedback as the admin types — the same validateConfig() the server
  // re-checks on submit, imported directly since assignment-engine is
  // dependency-free/isomorphic (works in the browser bundle for free).
  const liveErrors = validateConfig(clientConfig);

  const cancelHref = mode === 'create'
    ? `/projects/${projectId}/experiments`
    : `/projects/${projectId}/experiments/${initialKey}`;

  async function onSubmit(values: ExperimentFormValues) {
    const payload = {
      key: values.key,
      name: values.name,
      description: values.description,
      conversionEvent: values.conversionEvent,
      status: values.status,
      variants: values.variants.map((variant) => ({ key: variant.key, weight: variant.weight, label: variant.label.trim() || undefined })),
      // Always send a real array, even when empty — the PATCH route treats
      // a genuinely missing `targeting` key as "leave it unchanged" (partial
      // update semantics), so sending `undefined` here for "no rules" was
      // indistinguishable from "don't touch existing targeting," meaning
      // removing every rule in the edit wizard could never actually clear
      // them. An empty array and `undefined` are equivalent everywhere
      // targeting actually gets evaluated (assign() checks `.length > 0`),
      // so this only matters for the update's own missing-vs-empty signal.
      targeting: values.targeting.map(coerceTargetingRow),
    };

    const url = mode === 'create'
      ? `/api/projects/${projectId}/experiments`
      : `/api/projects/${projectId}/experiments/${initialKey}`;
    const body = await run(
      url,
      { method: mode === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
      'Something went wrong'
    );
    if (!body) return;

    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{mode === 'create' ? 'New experiment' : 'Edit experiment'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up traffic split, targeting, and review before {mode === 'create' ? 'launch' : 'saving your changes'}.
            </p>
          </div>
          {headerActions && <div className="flex gap-2">{headerActions}</div>}
        </div>

        <div className="flex gap-6">
          <StepRail steps={STEPS} currentStep={step} />

          <Card className="flex-1">
            <CardHeader>
              <div className="text-sm font-semibold text-foreground">{STEPS[step].label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{STEPS[step].cardDescription}</div>
            </CardHeader>
            <CardContent>
              {step === 0 && <BasicsStep mode={mode} />}
              {step === 1 && <VariantsStep liveErrors={liveErrors} />}
              {step === 2 && <TargetingStep contextKeys={contextKeys} />}
              {step === 3 && <ReviewStep contextKeys={contextKeys} serverErrors={serverErrors} />}

              <WizardNav
                step={step}
                totalSteps={STEPS.length}
                cancelHref={cancelHref}
                onBack={() => setStep(Math.max(0, step - 1))}
                onNext={() => setStep(step + 1)}
                onSubmit={form.handleSubmit(onSubmit)}
                nextDisabled={step === 0 && (!name || !key)}
                submitDisabled={pending || liveErrors.length > 0}
                submitLabel={pending ? 'Saving…' : mode === 'create' ? 'Create experiment' : 'Save changes'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}
