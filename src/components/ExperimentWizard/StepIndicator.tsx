'use client';

export function StepIndicator({ steps, currentStep }: { steps: readonly string[]; currentStep: number }) {
  return (
    <div className="mb-8 flex gap-2">
      {steps.map((label, index) => (
        <div
          key={label}
          className={`flex-1 border-b-2 pb-2 text-center text-xs font-medium ${
            index === currentStep ? 'border-primary text-foreground' : 'border-border text-muted-foreground'
          }`}
        >
          {index + 1}. {label}
        </div>
      ))}
    </div>
  );
}
