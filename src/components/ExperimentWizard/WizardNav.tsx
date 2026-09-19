'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function WizardNav({
  step,
  totalSteps,
  cancelHref,
  onBack,
  onNext,
  onSubmit,
  nextDisabled,
  submitDisabled,
  submitLabel,
}: {
  step: number;
  totalSteps: number;
  cancelHref: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  nextDisabled: boolean;
  submitDisabled: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
      <Button type="button" variant="ghost" asChild>
        <Link href={cancelHref}>Cancel</Link>
      </Button>
      <div className="flex gap-2">
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
    </div>
  );
}
