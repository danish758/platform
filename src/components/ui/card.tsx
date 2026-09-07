import type { FC, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-border bg-card', className)} {...props} />
);

export const CardHeader: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('border-b border-border px-5 py-4', className)} {...props} />
);

export const CardContent: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-5', className)} {...props} />
);
