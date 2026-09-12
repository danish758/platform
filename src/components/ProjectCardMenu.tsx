'use client';

import { MoreVertical, Trash2 } from 'lucide-react';
import { useState, type FC } from 'react';
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ProjectCardMenuProps = { projectId: string; projectName: string };

export const ProjectCardMenu: FC<ProjectCardMenuProps> = ({ projectId, projectName }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Project actions"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100 data-[state=open]:bg-secondary data-[state=open]:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-40 border-border bg-popover p-1">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              setIsDeleteOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete project
          </button>
        </PopoverContent>
      </Popover>

      <DeleteProjectDialog projectId={projectId} projectName={projectName} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} />
    </>
  );
};
