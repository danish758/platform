import type { Project } from '@prisma/client';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { prisma } from './db';
import { getAccountBySessionId, SESSION_COOKIE } from './session';

/**
 * Resolves the logged-in account from the session cookie. Routes/pages under
 * /projects and /api/projects are already gated by middleware — this
 * re-checks rather than trusting a forwarded header, so account identity for
 * an authorization-sensitive lookup never depends on trusting client-passed
 * state, only on this server-side cookie lookup.
 *
 * cache() dedupes it across one render pass — nested layouts and the page all
 * resolve the session, and without this that is a repeated query per request.
 * It still performs a real cookie lookup per request, so the property above
 * holds; only the repeat within a single render is elided.
 */
export const getCurrentAccount = cache(async (): Promise<{ id: string; email: string } | null> => {
  const { value: sessionId } = (await cookies()).get(SESSION_COOKIE) || {};
  return getAccountBySessionId(sessionId);
});

/**
 * The multi-tenancy ownership check: a project id alone is not enough to act
 * on it, it must also belong to the requesting account. Every project-scoped
 * route should route through this rather than a bare `findUnique(id)`.
 */
export async function requireOwnedProject(accountId: string, projectId: string): Promise<Project | null> {
  return prisma.project.findFirst({ where: { id: projectId, accountId } });
}
