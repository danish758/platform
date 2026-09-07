import type { FC, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Table: FC<HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="rounded-lg border border-border">
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  </div>
);

export const TableHeader: FC<HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-muted/50', className)} {...props} />
);

export const TableBody: FC<HTMLAttributes<HTMLTableSectionElement>> = (props) => <tbody {...props} />;

export const TableRow: FC<HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('border-b border-border last:border-0 hover:bg-secondary/50', className)} {...props} />
);

export const TableHead: FC<ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th
    className={cn(
      'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
      className
    )}
    {...props}
  />
);

export const TableCell: FC<TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 text-foreground', className)} {...props} />
);
