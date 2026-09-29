import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';
import { hashPassword } from '@/lib/password';
import { createSession, SESSION_COOKIE } from '@/lib/session';
import { signupSchema } from '@/lib/validation/auth';
import { parseJsonBody } from '@/lib/validation/parse';

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJsonBody(request, signupSchema);
  // The signup page renders a single `error` string, not an `errors` list.
  if (!parsed.success) return NextResponse.json({ error: parsed.errors[0] }, { status: HTTP_STATUS.BAD_REQUEST });
  const { email, password } = parsed.data;

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: HTTP_STATUS.CONFLICT });
  }

  const passwordHash = await hashPassword(password);
  const account = await prisma.account.create({ data: { email, passwordHash } });
  const session = await createSession(account.id);

  (await cookies()).set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    expires: session.expiresAt,
  });

  return NextResponse.json({ ok: true });
}
