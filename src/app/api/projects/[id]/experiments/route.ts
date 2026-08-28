import type { ExperimentConfig } from '@cro-engine/assignment-engine';
import { NextResponse } from 'next/server';
import { getCurrentAccount, requireOwnedProject } from '@/lib/authz';
import { prisma } from '@/lib/db';
import type { VariantWithLabel } from '@/lib/experiment-repo';
import { validateExperimentInput } from '@/lib/experiment-input';
import { HTTP_STATUS } from '@/lib/http-status';

const KEY_RE = /^[a-z0-9][a-z0-9-]*$/;

type CreateBody = {
  key?: string;
  name?: string;
  description?: string;
  conversionEvent?: string;
  status?: ExperimentConfig['status'];
  variants?: VariantWithLabel[];
  targeting?: ExperimentConfig['targeting'];
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const { id: projectId } = await params;
  const project = await requireOwnedProject(account.id, projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: HTTP_STATUS.NOT_FOUND });

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  const {
    key,
    name: rawName = '',
    description: rawDescription = '',
    conversionEvent: rawConversionEvent = '',
    status = 'draft',
    variants = [],
    targeting,
  } = body || {};

  if (!key || !KEY_RE.test(key)) {
    return NextResponse.json(
      { errors: ['key must be lowercase letters, numbers, and hyphens only'] },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
  const name = rawName.trim();
  if (!name) {
    return NextResponse.json({ errors: ['name is required'] }, { status: HTTP_STATUS.BAD_REQUEST });
  }

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

  const errors = await validateExperimentInput(projectId, config);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const existing = await prisma.experiment.findUnique({
    where: { projectId_key: { projectId, key: config.key } },
  });
  if (existing) {
    return NextResponse.json({ errors: [`an experiment with key "${config.key}" already exists`] }, { status: HTTP_STATUS.CONFLICT });
  }

  try {
    const row = await prisma.experiment.create({
      data: {
        projectId,
        key: config.key,
        name,
        description: rawDescription.trim() || null,
        conversionEvent: rawConversionEvent.trim() || null,
        status: config.status,
        variantsJson: JSON.stringify(variants),
        targetingJson: config.targeting ? JSON.stringify(config.targeting) : null,
      },
    });
    return NextResponse.json({ experiment: row });
  } catch (err: unknown) {
    const isUniqueConstraintError = typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
    if (isUniqueConstraintError) {
      return NextResponse.json({ errors: [`an experiment with key "${config.key}" already exists`] }, { status: HTTP_STATUS.CONFLICT });
    }
    throw err;
  }
}
