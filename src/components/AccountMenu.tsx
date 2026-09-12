'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type FC } from 'react';
import { LogoutButton } from '@/components/LogoutButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type AccountMenuProps = { email: string };

export const AccountMenu: FC<AccountMenuProps> = ({ email }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[14rem] truncate text-muted-foreground">{email}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto border-border bg-popover p-2">
        <LogoutButton />
      </PopoverContent>
    </Popover>
  );
};
