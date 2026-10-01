import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';
import { verifyPassword } from '@/lib/password';
import { createSession, SESSION_COOKIE } from '@/lib/session';
import { loginSchema } from '@/lib/validation/auth';
import { parseJsonBody } from '@/lib/validation/parse';

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJsonBody(request, loginSchema);
  // The login page renders a single `error` string, not an `errors` list.
  if (!parsed.success) return NextResponse.json({ error: parsed.errors[0] }, { status: HTTP_STATUS.BAD_REQUEST });
  const { email, password } = parsed.data;

  const account = await prisma.account.findUnique({ where: { email } });
  // Same error for "no such account" and "wrong password" — don't leak
  // which one it was.
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const session = await createSession(account.id);
  (await cookies()).set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    expires: session.expiresAt,
  });

  return NextResponse.json({ ok: true });
}
