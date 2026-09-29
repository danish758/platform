'use client';

import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { DeleteContextKeyButton } from '@/components/DeleteContextKeyButton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function ContextKeyActionsMenu({
  projectId,
  keyId,
  contextKey,
}: {
  projectId: string;
  keyId: string;
  contextKey: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="rounded-full px-4 py-3" aria-label="More actions">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 border-border bg-popover p-1.5">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive hover:text-white"
          >
            Delete
          </button>
        </PopoverContent>
      </Popover>

      {/* Rendered as a sibling of the Popover, not inside its content — Radix
          unmounts PopoverContent's subtree when the menu closes, which would
          tear down this AlertDialog (and its own open state) before it ever
          got a chance to show. */}
      <DeleteContextKeyButton
        projectId={projectId}
        keyId={keyId}
        contextKey={contextKey}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
