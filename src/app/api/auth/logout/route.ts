import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { destroySession, SESSION_COOKIE } from '@/lib/session';

export async function POST() {
  const cookieStore = await cookies();
  const { value: sessionId } = cookieStore.get(SESSION_COOKIE) || {};
  if (sessionId) await destroySession(sessionId);
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
