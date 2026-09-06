'use client';

import { ArrowLeft, FlaskConical, Home, KeyRound, LayoutDashboard, Tags, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC } from 'react';

type NavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean };

type ProjectSidebarProps = { projectId: string; projectName: string };

export const ProjectSidebar: FC<ProjectSidebarProps> = ({ projectId, projectName }) => {
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
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <Link href="/projects" className="flex items-center gap-1.5 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>
      <h2 className="mt-3 truncate text-base font-semibold text-slate-900">{projectName}</h2>

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
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
