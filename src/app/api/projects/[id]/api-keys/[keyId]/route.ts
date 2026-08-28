import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId, keyId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  // Revoke, don't delete — keeps an audit trail and matches how the
  // hashedKey unique constraint should behave if the same random value were
  // ever generated again (astronomically unlikely, but revocation leaving a
  // dead row is simpler to reason about than deletion).
  const result = await prisma.apiKey.updateMany({
    where: { id: keyId, projectId },
    data: { revokedAt: new Date() },
  });

  if (result.count === 0) return NextResponse.json({ error: 'API key not found' }, { status: HTTP_STATUS.NOT_FOUND });
  return NextResponse.json({ ok: true });
}
