'use client';

export type WizardStep = { label: string; description: string };

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function StepRail({ steps, currentStep }: { steps: readonly WizardStep[]; currentStep: number }) {
  const progressPercent = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;

  return (
    <div className="relative w-52 shrink-0">
      <div className="absolute bottom-[22px] left-[22px] top-[22px] w-px bg-border" />
      <div
        className="absolute left-[22px] top-[22px] w-px bg-primary transition-[height]"
        style={{ height: `${progressPercent}%` }}
      />
      <ol className="space-y-1">
        {steps.map((stepItem, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          return (
            <li
              key={stepItem.label}
              className={`relative flex gap-3 rounded-md border-l-2 px-2 py-2.5 ${
                isActive ? 'border-primary bg-primary/5' : 'border-transparent'
              }`}
            >
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isCompleted || isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'border-2 border-border bg-background text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckIcon /> : index + 1}
              </span>
              <span className="pt-0.5">
                <span className={`block text-sm font-semibold ${isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stepItem.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{stepItem.description}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
