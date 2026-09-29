import { AlertCircle } from 'lucide-react';
import type { FC } from 'react';

type InlineErrorProps = { id?: string; message: string };

export const InlineError: FC<InlineErrorProps> = ({ id, message }) => (
  <p id={id} className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    {message}
  </p>
);
