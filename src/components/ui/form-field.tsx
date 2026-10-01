import { Slot } from '@radix-ui/react-slot';
import type { FC, ReactNode } from 'react';
import { InlineError } from '@/components/ui/inline-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// The counter stays hidden until it's useful — most values never get close.
const COUNTER_VISIBLE_RATIO = 0.8;

type Counter = { value: string; max: number };

type FormFieldProps = {
  id: string;
  label: string;
  optional?: boolean;
  /** A predicate message ("is required"), read after the label: "Name is required". */
  error?: { message?: string };
  help?: ReactNode;
  counter?: Counter;
  /** A single input-like element; it receives id and aria-* wiring. */
  children: ReactNode;
};

const CharacterCount: FC<Counter> = ({ value, max }) => {
  const { length } = value;
  if (length < max * COUNTER_VISIBLE_RATIO) return null;
  return (
    <span className={cn('text-sm tabular-nums', length > max ? 'text-destructive' : 'text-warning')}>
      {length} / {max}
    </span>
  );
};

export const FormField: FC<FormFieldProps> = ({ id, label, optional = false, error, help, counter, children }) => {
  const { message } = error || {};
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const describedBy = message ? errorId : help ? helpId : undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor={id}>
          {label}
          {optional && ' (optional)'}
        </Label>
        {counter && <CharacterCount {...counter} />}
      </div>
      <Slot id={id} aria-invalid={Boolean(message)} aria-describedby={describedBy}>
        {children}
      </Slot>
      {message ? (
        <InlineError id={errorId} message={`${label} ${message}`} />
      ) : (
        help && (
          <p id={helpId} className="mt-2 text-sm text-muted-foreground">
            {help}
          </p>
        )
      )}
    </div>
  );
};
