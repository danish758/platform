import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';

const KEY_RE = /^[a-z0-9][a-z0-9_]*$/;
const KNOWN_TYPES = new Set(['string', 'number']);

type CreateBody = {
  key?: string;
  label?: string;
  type?: string;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const contextKeys = await prisma.contextKey.findMany({ where: { projectId }, orderBy: { key: 'asc' } });
  return NextResponse.json({ contextKeys });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  if (!body?.key || !KEY_RE.test(body.key)) {
    return NextResponse.json(
      { errors: ['key must be lowercase letters, numbers, and underscores only'] },
      { status: 400 }
    );
  }
  if (!body.type || !KNOWN_TYPES.has(body.type)) {
    return NextResponse.json({ errors: ['type must be "string" or "number"'] }, { status: 400 });
  }

  try {
    const contextKey = await prisma.contextKey.create({
      data: {
        projectId,
        key: body.key,
        label: body.label?.trim() || null,
        type: body.type,
      },
    });
    return NextResponse.json({ contextKey });
  } catch (err: unknown) {
    const isUniqueConstraintError = typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
    if (isUniqueConstraintError) {
      return NextResponse.json({ errors: [`a context key named "${body.key}" already exists`] }, { status: 409 });
    }
    throw err;
  }
}
