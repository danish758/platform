import type { ExperimentConfig } from '@cro-engine/assignment-engine';
import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { parseVariantsWithLabels, toConfig, type VariantWithLabel } from '@/lib/experiment-repo';
import { validateExperimentInput } from '@/lib/experiment-input';
import { HTTP_STATUS } from '@/lib/http-status';

type Params = { params: Promise<{ id: string; key: string }> };

type PatchBody = {
  name?: string;
  description?: string;
  status?: ExperimentConfig['status'];
  variants?: VariantWithLabel[];
  targeting?: ExperimentConfig['targeting'];
  seed?: number;
  conversionEvent?: string;
};

export async function GET(_request: Request, { params }: Params) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId, key } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const row = await prisma.experiment.findUnique({ where: { projectId_key: { projectId, key } } });
  if (!row) return NextResponse.json({ error: 'Experiment not found' }, { status: HTTP_STATUS.NOT_FOUND });

  return NextResponse.json({ experiment: row });
}

export async function PATCH(request: Request, { params }: Params) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId, key } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const existingRow = await prisma.experiment.findUnique({ where: { projectId_key: { projectId, key } } });
  if (!existingRow) return NextResponse.json({ error: 'Experiment not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ errors: ['request body must be valid JSON'] }, { status: HTTP_STATUS.BAD_REQUEST });

  const { name: rawName = '' } = body;
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
    targeting: body.targeting !== undefined ? body.targeting : existingConfig.targeting,
    seed: body.seed !== undefined ? body.seed : existingConfig.seed,
  };

  const errors = await validateExperimentInput(projectId, mergedConfig);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const row = await prisma.experiment.update({
    where: { projectId_key: { projectId, key } },
    data: {
      name: rawName.trim() || existingRow.name,
      description: body.description !== undefined ? body.description.trim() || null : existingRow.description,
      conversionEvent:
        body.conversionEvent !== undefined ? body.conversionEvent.trim() || null : existingRow.conversionEvent,
      status: mergedConfig.status,
      variantsJson: JSON.stringify(mergedVariants),
      targetingJson: mergedConfig.targeting ? JSON.stringify(mergedConfig.targeting) : null,
      seed: mergedConfig.seed ?? null,
    },
  });

  return NextResponse.json({ experiment: row });
}

export async function DELETE(_request: Request, { params }: Params) {
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
