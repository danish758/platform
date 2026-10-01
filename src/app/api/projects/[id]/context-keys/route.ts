import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';
import { isUniqueConstraintError } from '@/lib/prisma-errors';
import { createContextKeySchema } from '@/lib/validation/context-key';
import { parseJsonBody } from '@/lib/validation/parse';

function labelConflict(label: string): string {
  return `label "${label}" is already used by another context key`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const contextKeys = await prisma.contextKey.findMany({ where: { projectId }, orderBy: { key: 'asc' } });
  return NextResponse.json({ contextKeys });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const parsed = await parseJsonBody(request, createContextKeySchema);
  if (!parsed.success) return NextResponse.json({ errors: parsed.errors }, { status: HTTP_STATUS.BAD_REQUEST });
  const { key, label, type } = parsed.data;

  // Case-insensitive: labels are what admins pick from in the targeting editor.
  const labelTaken = await prisma.contextKey.findFirst({
    where: { projectId, label: { equals: label, mode: 'insensitive' } },
    select: { id: true },
  });
  if (labelTaken) return NextResponse.json({ errors: [labelConflict(label)] }, { status: HTTP_STATUS.CONFLICT });

  try {
    const contextKey = await prisma.contextKey.create({ data: { projectId, key, label, type } });
    return NextResponse.json({ contextKey });
  } catch (err: unknown) {
    if (isUniqueConstraintError(err, 'label')) {
      return NextResponse.json({ errors: [labelConflict(label)] }, { status: HTTP_STATUS.CONFLICT });
    }
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ errors: [`key "${key}" is already used by another context key`] }, { status: HTTP_STATUS.CONFLICT });
    }
    throw err;
  }
}
