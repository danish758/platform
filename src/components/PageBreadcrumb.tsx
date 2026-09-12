import type { FC } from 'react';
import { Fragment } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export type Crumb = { label: string; href?: string };

type PageBreadcrumbProps = { items: Crumb[] };

export const PageBreadcrumb: FC<PageBreadcrumbProps> = ({ items }) => (
  <Breadcrumb className="mb-4">
    <BreadcrumbList>
      {items.map(({ label, href }, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={label}>
            <BreadcrumbItem>
              {isLast || !href ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={href}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      })}
    </BreadcrumbList>
  </Breadcrumb>
);
