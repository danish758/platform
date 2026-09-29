import { forwardRef, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-md border border-input bg-input-background px-3 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
