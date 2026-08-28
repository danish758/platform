import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';
import { hashPassword } from '@/lib/password';
import { createSession, SESSION_COOKIE } from '@/lib/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const { email: rawEmail = '', password } = body || {};
  const email = rawEmail.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: HTTP_STATUS.BAD_REQUEST });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: HTTP_STATUS.BAD_REQUEST });
  }

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
