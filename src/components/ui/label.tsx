import type { FC, LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Label: FC<LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('mb-1.5 block text-base font-medium text-foreground', className)} {...props} />
);
