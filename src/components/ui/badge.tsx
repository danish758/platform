import { cva, type VariantProps } from 'class-variance-authority';
import type { FC, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-primary/15 text-primary',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/15 text-warning',
      danger: 'bg-destructive/20 text-destructive',
      neutral: 'bg-neutral/15 text-neutral',
      outline: 'border border-border text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export const Badge: FC<BadgeProps> = ({ className, variant, ...props }) => (
  <span className={cn(badgeVariants({ variant, className }))} {...props} />
);

export { badgeVariants };
