import type { TargetingRule } from '@cro-engine/assignment-engine';
import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { HTTP_STATUS } from '@/lib/http-status';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId, keyId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const contextKey = await prisma.contextKey.findFirst({ where: { id: keyId, projectId } });
  if (!contextKey) return NextResponse.json({ error: 'Context key not found' }, { status: HTTP_STATUS.NOT_FOUND });

  // No join table between targeting rules and context keys — targeting is
  // stored as an opaque JSON blob per experiment (see schema.prisma), so
  // "is this key referenced anywhere" means scanning every experiment's
  // targetingJson for a rule naming it. Deleting a key still in use would
  // silently break that rule (fails closed: matchesTargeting excludes
  // everyone once its attribute is unresolvable), so this blocks instead.
  const experiments = await prisma.experiment.findMany({
    where: { projectId },
    select: { key: true, targetingJson: true },
  });
  const referencedBy = experiments
    .filter((experiment) => {
      if (!experiment.targetingJson) return false;
      const rules = JSON.parse(experiment.targetingJson) as TargetingRule[];
      return rules.some((rule) => rule.attribute === contextKey.key);
    })
    .map((experiment) => experiment.key);

  if (referencedBy.length > 0) {
    return NextResponse.json(
      { errors: [`"${contextKey.key}" is used by targeting rules on: ${referencedBy.join(', ')}`] },
      { status: HTTP_STATUS.CONFLICT }
    );
  }

  await prisma.contextKey.delete({ where: { id: keyId } });
  return NextResponse.json({ ok: true });
}
