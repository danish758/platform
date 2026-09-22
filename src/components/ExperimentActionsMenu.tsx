'use client';

import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { DeleteExperimentButton } from '@/components/DeleteExperimentButton';
import { RerandomizeButton } from '@/components/RerandomizeButton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ActiveDialog = 'rerandomize' | 'delete' | null;

export function ExperimentActionsMenu({
  projectId,
  experimentKey,
  currentSeed,
}: {
  projectId: string;
  experimentKey: string;
  currentSeed: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

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
              setActiveDialog('rerandomize');
            }}
            className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
          >
            Force re-randomize
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setActiveDialog('delete');
            }}
            className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive hover:text-white"
          >
            Delete
          </button>
        </PopoverContent>
      </Popover>

      {/* Rendered as siblings of the Popover, not inside its content — Radix
          unmounts PopoverContent's subtree when the menu closes, which would
          tear down these AlertDialogs (and their own open state) before they
          ever got a chance to show. */}
      <RerandomizeButton
        projectId={projectId}
        experimentKey={experimentKey}
        currentSeed={currentSeed}
        open={activeDialog === 'rerandomize'}
        onOpenChange={(next) => setActiveDialog(next ? 'rerandomize' : null)}
      />
      <DeleteExperimentButton
        projectId={projectId}
        experimentKey={experimentKey}
        open={activeDialog === 'delete'}
        onOpenChange={(next) => setActiveDialog(next ? 'delete' : null)}
      />
    </>
  );
}
