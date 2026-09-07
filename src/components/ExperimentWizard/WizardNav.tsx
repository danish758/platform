'use client';

import { Button } from '@/components/ui/button';

export function WizardNav({
  step,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  nextDisabled,
  submitDisabled,
  submitLabel,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  nextDisabled: boolean;
  submitDisabled: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-8 flex justify-between">
      <Button type="button" variant="outline" onClick={onBack} disabled={step === 0}>
        Back
      </Button>
      {step < totalSteps - 1 ? (
        <Button type="button" onClick={onNext} disabled={nextDisabled}>
          Next
        </Button>
      ) : (
        <Button type="button" onClick={onSubmit} disabled={submitDisabled}>
          {submitLabel}
        </Button>
      )}
    </div>
  );
}
