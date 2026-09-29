import { Lock } from 'lucide-react';
import type { FC } from 'react';

/** Stands in for a card's edit button while the experiment is running —
 * see RUN_LOCKED_FIELDS for why these settings can't change mid-run. */
export const LockedWhileRunning: FC = () => (
  <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
    Locked while running. Stop the experiment to edit.
  </p>
);
