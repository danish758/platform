'use client';

import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { RevokeApiKeyButton } from '@/components/RevokeApiKeyButton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function ApiKeyActionsMenu({ projectId, keyId }: { projectId: string; keyId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

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
              setRevokeOpen(true);
            }}
            className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive hover:text-white"
          >
            Revoke
          </button>
        </PopoverContent>
      </Popover>

      {/* Rendered as a sibling of the Popover, not inside its content — Radix
          unmounts PopoverContent's subtree when the menu closes, which would
          tear down this AlertDialog (and its own open state) before it ever
          got a chance to show. */}
      <RevokeApiKeyButton projectId={projectId} keyId={keyId} open={revokeOpen} onOpenChange={setRevokeOpen} />
    </>
  );
}
