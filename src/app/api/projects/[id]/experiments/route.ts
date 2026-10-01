import type { ExperimentConfig } from '@cro-engine/assignment-engine';
import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { isExperimentNameTaken, nameConflictMessage } from '@/lib/experiment-repo';
import { validateExperimentInput } from '@/lib/experiment-input';
import { HTTP_STATUS } from '@/lib/http-status';
import { isUniqueConstraintError } from '@/lib/prisma-errors';
import { createExperimentSchema } from '@/lib/validation/experiment';
import { parseJsonBody } from '@/lib/validation/parse';
import { formatVariantListErrors } from '@/lib/validation/variants';

function keyConflict(key: string): string {
  return `key "${key}" is already used by another experiment`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const parsed = await parseJsonBody(request, createExperimentSchema);
  if (!parsed.success) return NextResponse.json({ errors: parsed.errors }, { status: HTTP_STATUS.BAD_REQUEST });
  const { key, name, description, conversionEvent, status, variants, targeting } = parsed.data;

  const config: ExperimentConfig = {
    key,
    status,
    // Validation only needs the engine-facing shape — labels are stripped
    // here so validateConfig() (from @cro-engine/assignment-engine) sees
    // exactly the {key, weight} shape it expects; the label-bearing
    // `variants` array below is what actually gets persisted.
    variants: variants.map((variant) => ({ key: variant.key, weight: variant.weight })),
    targeting,
  };

  const errors = [...formatVariantListErrors(variants), ...(await validateExperimentInput(projectId, config))];
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const [keyTaken, nameTaken] = await Promise.all([
    prisma.experiment.findUnique({ where: { projectId_key: { projectId, key } }, select: { id: true } }),
    isExperimentNameTaken(projectId, name),
  ]);
  const conflicts = [...(keyTaken ? [keyConflict(key)] : []), ...(nameTaken ? [nameConflictMessage(name)] : [])];
  if (conflicts.length > 0) return NextResponse.json({ errors: conflicts }, { status: HTTP_STATUS.CONFLICT });

  try {
    const row = await prisma.experiment.create({
      data: {
        projectId,
        key,
        name,
        description: description || null,
        conversionEvent: conversionEvent || null,
        status: config.status,
        variantsJson: JSON.stringify(variants),
        targetingJson: config.targeting ? JSON.stringify(config.targeting) : null,
      },
    });
    return NextResponse.json({ experiment: row });
  } catch (err: unknown) {
    // Race backstop: another request took the key or name since the check above.
    if (isUniqueConstraintError(err, 'name')) {
      return NextResponse.json({ errors: [nameConflictMessage(name)] }, { status: HTTP_STATUS.CONFLICT });
    }
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ errors: [keyConflict(key)] }, { status: HTTP_STATUS.CONFLICT });
    }
    throw err;
  }
}
