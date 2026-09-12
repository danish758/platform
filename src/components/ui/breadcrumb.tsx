import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Breadcrumb: FC<ComponentPropsWithoutRef<'nav'>> = (props) => (
  <nav aria-label="breadcrumb" {...props} />
);

export const BreadcrumbList: FC<ComponentPropsWithoutRef<'ol'>> = ({ className, ...props }) => (
  <ol
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm font-medium text-muted-foreground sm:gap-2.5',
      className
    )}
    {...props}
  />
);

export const BreadcrumbItem: FC<ComponentPropsWithoutRef<'li'>> = ({ className, ...props }) => (
  <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />
);

type BreadcrumbLinkProps = ComponentPropsWithoutRef<'a'> & { asChild?: boolean };

export const BreadcrumbLink: FC<BreadcrumbLinkProps> = ({ asChild = false, className, ...props }) => {
  const Comp = asChild ? Slot : 'a';
  return <Comp className={cn('transition-colors hover:text-foreground', className)} {...props} />;
};

export const BreadcrumbPage: FC<ComponentPropsWithoutRef<'span'>> = ({ className, ...props }) => (
  <span
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('text-foreground', className)}
    {...props}
  />
);

export const BreadcrumbSeparator: FC<ComponentPropsWithoutRef<'li'> & { children?: ReactNode }> = ({
  children,
  className,
  ...props
}) => (
  <li role="presentation" aria-hidden="true" className={cn('[&>svg]:size-3.5', className)} {...props}>
    {children ?? <ChevronRight />}
  </li>
);

export const BreadcrumbEllipsis: FC<ComponentPropsWithoutRef<'span'>> = ({ className, ...props }) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
