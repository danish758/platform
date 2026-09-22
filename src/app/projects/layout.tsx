import { redirect } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { getCurrentAccount } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) redirect('/login');

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar accountEmail={account.email} />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
