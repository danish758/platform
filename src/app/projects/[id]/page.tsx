import Link from 'next/link';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { prisma } from '@/lib/db';
import { getExperimentsRequiringAttention } from '@/lib/experiment-attention';

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUniqueOrThrow({ where: { id } });
  const [experimentCount, apiKeyCount, contextKeyCount, attentionRows] = await Promise.all([
    prisma.experiment.count({ where: { projectId: id } }),
    prisma.apiKey.count({ where: { projectId: id } }),
    prisma.contextKey.count({ where: { projectId: id } }),
    getExperimentsRequiringAttention(id),
  ]);

  return (
    <div>
      <PageBreadcrumb items={[{ label: 'Projects', href: '/projects' }, { label: project.name }]} />
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Created {project.createdAt.toISOString().slice(0, 10)}</p>

      <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
        <StatCard label="Experiments" value={experimentCount} href={`/projects/${id}/experiments`} />
        <StatCard label="API keys" value={apiKeyCount} href={`/projects/${id}/api-keys`} />
        <StatCard label="Context keys" value={contextKeyCount} href={`/projects/${id}/context-keys`} />
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Experiments requiring attention
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {attentionRows.length}
          </span>
        </h2>

        {attentionRows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No running experiments need attention right now.</p>
        ) : (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attentionRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <Link href={`/projects/${id}/experiments/${row.key}`} className="font-medium hover:underline">
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning">{row.reasonLabel}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Card className="p-5 hover:border-ring/40">
      <Link href={href}>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </Link>
    </Card>
  );
}
