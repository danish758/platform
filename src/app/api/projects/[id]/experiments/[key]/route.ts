import type { ExperimentConfig } from '@cro-engine/assignment-engine';
import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { isExperimentNameTaken, nameConflictMessage, parseVariantsWithLabels, toConfig } from '@/lib/experiment-repo';
import { validateExperimentInput } from '@/lib/experiment-input';
import { runLockErrors } from '@/lib/experiment-status';
import { HTTP_STATUS } from '@/lib/http-status';
import { isUniqueConstraintError } from '@/lib/prisma-errors';
import { updateExperimentSchema } from '@/lib/validation/experiment';
import { parseJsonBody } from '@/lib/validation/parse';
import { formatVariantListErrors } from '@/lib/validation/variants';

type Params = { params: Promise<{ id: string; key: string }> };

export async function GET(_request: Request, { params }: Params): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId, key } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const row = await prisma.experiment.findUnique({ where: { projectId_key: { projectId, key } } });
  if (!row) return NextResponse.json({ error: 'Experiment not found' }, { status: HTTP_STATUS.NOT_FOUND });

  return NextResponse.json({ experiment: row });
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId, key } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const existingRow = await prisma.experiment.findUnique({ where: { projectId_key: { projectId, key } } });
  if (!existingRow) return NextResponse.json({ error: 'Experiment not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const parsed = await parseJsonBody(request, updateExperimentSchema);
  if (!parsed.success) return NextResponse.json({ errors: parsed.errors }, { status: HTTP_STATUS.BAD_REQUEST });
  const { data: body } = parsed;

  // 409 rather than 400: the request is well-formed, the experiment's
  // current state is what forbids it.
  const lockErrors = runLockErrors(existingRow.status, body);
  if (lockErrors.length > 0) return NextResponse.json({ errors: lockErrors }, { status: HTTP_STATUS.CONFLICT });

  const existingConfig = toConfig(existingRow);
  // Same missing-vs-empty distinction as targeting: a genuinely absent
  // `variants` key means "leave them (and their labels) unchanged," so this
  // reads from the stored label-bearing array rather than existingConfig
  // (which has already had labels stripped for the engine-facing shape).
  const mergedVariants = body.variants ?? parseVariantsWithLabels(existingRow);
  const mergedConfig: ExperimentConfig = {
    key,
    status: body.status ?? existingConfig.status,
    variants: mergedVariants.map((variant) => ({ key: variant.key, weight: variant.weight })),
    targeting: body.targeting !== undefined ? body.targeting ?? undefined : existingConfig.targeting,
    seed: body.seed !== undefined ? body.seed : existingConfig.seed,
  };

  const storedVariantKeys = new Set(existingConfig.variants.map((variant) => variant.key));
  const errors = [
    ...(body.variants ? formatVariantListErrors(body.variants, storedVariantKeys) : []),
    ...(await validateExperimentInput(projectId, mergedConfig)),
  ];
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  if (body.name && (await isExperimentNameTaken(projectId, body.name, key))) {
    return NextResponse.json({ errors: [nameConflictMessage(body.name)] }, { status: HTTP_STATUS.CONFLICT });
  }

  const statusChangedToRunning = mergedConfig.status === 'running' && existingRow.status !== 'running';
  const statusChangedToStopped = mergedConfig.status === 'stopped' && existingRow.status !== 'stopped';

  try {
    const row = await prisma.experiment.update({
      where: { projectId_key: { projectId, key } },
      data: {
        name: body.name ?? existingRow.name,
        description: body.description !== undefined ? body.description || null : existingRow.description,
        conversionEvent: body.conversionEvent !== undefined ? body.conversionEvent || null : existingRow.conversionEvent,
        status: mergedConfig.status,
        variantsJson: JSON.stringify(mergedVariants),
        targetingJson: mergedConfig.targeting ? JSON.stringify(mergedConfig.targeting) : null,
        seed: mergedConfig.seed ?? null,
        // A restart (stopped -> running) bumps startedAt again — it's the
        // start of this run of traffic, not of the experiment row's lifetime.
        ...(statusChangedToRunning && { startedAt: new Date() }),
        ...(statusChangedToStopped && { stoppedAt: new Date() }),
      },
    });
    return NextResponse.json({ experiment: row });
  } catch (err: unknown) {
    // Race backstop for the name check above.
    if (body.name && isUniqueConstraintError(err, 'name')) {
      return NextResponse.json({ errors: [nameConflictMessage(body.name)] }, { status: HTTP_STATUS.CONFLICT });
    }
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId, key } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  // No cascade — Exposure/Conversion rows for this key are historical fact
  // and are left intact (they have no FK relation to Experiment, just
  // matching string columns; see schema.prisma).
  const result = await prisma.experiment.deleteMany({ where: { projectId, key } });
  if (result.count === 0) return NextResponse.json({ error: 'Experiment not found' }, { status: HTTP_STATUS.NOT_FOUND });

  return NextResponse.json({ ok: true });
}
