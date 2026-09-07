'use client';

import { FlaskConical, Home, KeyRound, LayoutDashboard, Tags, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC } from 'react';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';

type NavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean };

type ProjectSidebarProject = { id: string; name: string };

type ProjectSidebarProps = {
  projectId: string;
  projectName: string;
  projects: ProjectSidebarProject[];
};

export const ProjectSidebar: FC<ProjectSidebarProps> = ({ projectId, projectName, projects }) => {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  const navItems: NavItem[] = [
    { label: 'Overview', href: basePath, icon: Home, exact: true },
    { label: 'Experiments', href: `${basePath}/experiments`, icon: FlaskConical },
    { label: 'Context keys', href: `${basePath}/context-keys`, icon: Tags },
    { label: 'API keys', href: `${basePath}/api-keys`, icon: KeyRound },
    { label: 'Dashboard', href: `${basePath}/dashboard`, icon: LayoutDashboard },
  ];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-4">
      <ProjectSwitcher projects={projects} currentProjectId={projectId} currentProjectName={projectName} />

      <nav className="mt-6 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
