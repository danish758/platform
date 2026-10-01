import { NextResponse } from 'next/server';
import { generateApiKey } from '@/lib/api-key';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';
import { createApiKeySchema } from '@/lib/validation/api-key';
import { parseJsonBody } from '@/lib/validation/parse';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const parsed = await parseJsonBody(request, createApiKeySchema);
  if (!parsed.success) return NextResponse.json({ errors: parsed.errors }, { status: HTTP_STATUS.BAD_REQUEST });
  const { label } = parsed.data;

  // Only active keys count: reusing "production" after revoking the old
  // production key is the normal rotation flow. That partial rule can't be a
  // Prisma-declared unique index, so there's no DB backstop here — a race
  // would only produce two keys with the same label.
  const labelTaken = await prisma.apiKey.findFirst({
    where: { projectId, revokedAt: null, label: { equals: label, mode: 'insensitive' } },
    select: { id: true },
  });
  if (labelTaken) {
    return NextResponse.json(
      { errors: [`label "${label}" is already used by another active API key`] },
      { status: HTTP_STATUS.CONFLICT }
    );
  }

  const { raw, hashed } = generateApiKey();
  await prisma.apiKey.create({ data: { projectId, hashedKey: hashed, label } });

  // The raw key is returned exactly once, here — it is never retrievable
  // again (only its hash is persisted).
  return NextResponse.json({ key: raw });
}
