import { NextResponse } from 'next/server';
import { getCurrentAccount } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const { name: rawName = '' } = body || {};
  const name = rawName.trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: HTTP_STATUS.BAD_REQUEST });

  const project = await prisma.project.create({ data: { name, accountId: account.id } });
  return NextResponse.json({ project });
}
