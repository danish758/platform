'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getAvatarColor, getInitials } from '@/lib/avatar-color';
import { cn } from '@/lib/utils';

type ProjectSwitcherProject = { id: string; name: string };

type ProjectSwitcherProps = {
  projects: ProjectSwitcherProject[];
  currentProjectId: string;
  currentProjectName: string;
};

const ALL_PROJECTS_LABEL = 'All Projects';

export const ProjectSwitcher: FC<ProjectSwitcherProps> = ({ projects, currentProjectId, currentProjectName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const navigateTo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-border bg-secondary px-3 py-5 text-left text-foreground hover:bg-secondary/70"
        >
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white',
              getAvatarColor(currentProjectId)
            )}
          >
            {getInitials(currentProjectName)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{currentProjectName}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] border-border bg-popover p-0">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search..."  />
          <CommandList>
            <CommandEmpty>No projects match.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={ALL_PROJECTS_LABEL}
                onSelect={() => navigateTo('/projects')}
                className="gap-3 data-[selected=true]:bg-secondary"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
                  ALL
                </span>
                <span className="truncate font-medium">{ALL_PROJECTS_LABEL}</span>
              </CommandItem>

              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => navigateTo(`/projects/${project.id}`)}
                  className="gap-3 data-[selected=true]:bg-secondary"
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white',
                      getAvatarColor(project.id)
                    )}
                  >
                    {getInitials(project.name)}
                  </span>
                  <span className="truncate font-medium">{project.name}</span>
                  {project.id === currentProjectId && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
