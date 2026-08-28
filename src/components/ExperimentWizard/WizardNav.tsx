'use client';

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
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-30"
      >
        Back
      </button>
      {step < totalSteps - 1 ? (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
