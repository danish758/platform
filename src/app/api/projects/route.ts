import { NextResponse } from 'next/server';
import { getCurrentAccount } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';
import { isUniqueConstraintError } from '@/lib/prisma-errors';
import { parseJsonBody } from '@/lib/validation/parse';
import { createProjectSchema } from '@/lib/validation/project';

function duplicateNameResponse(name: string): NextResponse {
  return NextResponse.json({ errors: [`name "${name}" is already used by another project`] }, { status: HTTP_STATUS.CONFLICT });
}

export async function POST(request: Request): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const parsed = await parseJsonBody(request, createProjectSchema);
  if (!parsed.success) return NextResponse.json({ errors: parsed.errors }, { status: HTTP_STATUS.BAD_REQUEST });
  const { name } = parsed.data;

  // Case-insensitive, since "Storefront" and "storefront" would be
  // indistinguishable in the project switcher. The DB unique constraint only
  // catches exact matches (see schema.prisma) — it's the race backstop.
  const existing = await prisma.project.findFirst({
    where: { accountId: account.id, name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) return duplicateNameResponse(name);

  try {
    const project = await prisma.project.create({ data: { name, accountId: account.id } });
    return NextResponse.json({ project });
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) return duplicateNameResponse(name);
    throw err;
  }
}
