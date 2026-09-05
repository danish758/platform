import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  // Exposure and Conversion carry projectId as a plain field, not a Prisma
  // relation (see schema.prisma) — the control-plane/data-plane split means
  // there's no FK for Prisma's cascade to follow, so they're deleted
  // explicitly. ApiKey/Experiment/ContextKey cascade via the schema relation.
  await prisma.$transaction([
    prisma.exposure.deleteMany({ where: { projectId } }),
    prisma.conversion.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ]);

  return NextResponse.json({ ok: true });
}
