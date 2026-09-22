'use client';

import type { TargetingOperator } from '@cro-engine/assignment-engine';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OPERATOR_LABELS, OPERATOR_SYMBOLS } from '@/lib/targeting-labels';

export function OperatorSelect({
  value,
  options,
  onChange,
}: {
  value: TargetingOperator;
  options: TargetingOperator[];
  onChange: (operator: TargetingOperator) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-2 flex h-12 min-w-[6rem] items-center justify-between gap-2 rounded-md border border-input bg-input-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="font-mono">{OPERATOR_SYMBOLS[value]}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 border-border bg-popover p-1.5">
        {options.map((operator) => (
          <button
            key={operator}
            type="button"
            onClick={() => {
              onChange(operator);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm ${
              operator === value ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
          >
            <span className="w-9 shrink-0 font-mono">{OPERATOR_SYMBOLS[operator]}</span>
            <span>{OPERATOR_LABELS[operator]}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
