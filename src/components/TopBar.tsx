import Link from 'next/link';
import type { FC } from 'react';
import { AccountMenu } from '@/components/AccountMenu';

type TopBarProps = { accountEmail: string };

export const TopBar: FC<TopBarProps> = ({ accountEmail }) => (
  <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4">
    <Link href="/projects" className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        C
      </span>
      <span className="text-sm font-semibold">CRO Engine</span>
    </Link>

    <div className="flex-1" />

    <AccountMenu email={accountEmail} />
  </header>
);
