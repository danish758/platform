'use client';

import { useState } from 'react';

/**
 * Type, press Enter, the value becomes a removable chip and the input stays
 * focused for the next one — the same single-persistent-field behavior
 * AB Tasty's own value input uses, rather than mounting a new input per
 * chip. `max` caps how many chips are allowed: single-value operators
 * (eq/gt/lt) pass max={1} and the input disables once a chip exists, rather
 * than silently replacing the existing value on a second Enter.
 */
export function TagInput({
  values,
  onChange,
  type,
  max,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  type: 'string' | 'number';
  max?: number;
}) {
  const [draft, setDraft] = useState('');
  const atMax = max !== undefined && values.length >= max;

  function commitDraft() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (type === 'number' && Number.isNaN(Number(trimmed))) return;
    onChange([...values, trimmed]);
    setDraft('');
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
        >
          {value}
          <button
            type="button"
            onClick={() => onChange(values.filter((_, valueIndex) => valueIndex !== index))}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${value}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        disabled={atMax}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Some environments deliver a keydown without a resolved `.key`
          // (e.g. `"Unidentified"`) — fall back to the numeric keyCode so
          // Enter/Backspace still work there.
          if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            commitDraft();
          } else if ((e.key === 'Backspace' || e.keyCode === 8) && draft === '' && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commitDraft}
        placeholder={atMax ? 'remove to replace' : type === 'number' ? 'number, then Enter' : 'value, then Enter'}
        className="min-w-[8ch] flex-1 border-none bg-transparent px-1 py-0.5 text-sm outline-none disabled:bg-transparent disabled:placeholder:text-muted-foreground"
      />
    </div>
  );
}
