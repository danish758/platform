import { NextResponse } from 'next/server';
import { requireApiKeyProject } from '@/lib/api-key';
import { prisma } from '@/lib/db';
import { getVariantKeysByExperiment } from '@/lib/experiment-repo';
import { HTTP_STATUS } from '@/lib/http-status';
import { isUniqueConstraintError } from '@/lib/prisma-errors';
import { eventsBatchSchema, partitionEvents, type ExposureEvent } from '@/lib/validation/events';
import { parseJsonBody } from '@/lib/validation/parse';

/**
 * Deduplicated per (projectId, userId, experimentKey), same rule v1 had —
 * naively logging an exposure on every request would inflate visitor counts
 * relative to real unique exposures. Check-then-insert, with the schema's
 * unique constraint as the race-condition backstop (see schema.prisma).
 */
async function logExposure(projectId: string, event: ExposureEvent): Promise<void> {
  const existing = await prisma.exposure.findUnique({
    where: {
      projectId_userId_experimentKey: {
        projectId,
        userId: event.userId,
        experimentKey: event.experimentKey,
      },
    },
  });
  if (existing) return;

  try {
    await prisma.exposure.create({
      data: { projectId, userId: event.userId, experimentKey: event.experimentKey, variantKey: event.variantKey },
    });
  } catch (err: unknown) {
    if (!isUniqueConstraintError(err)) throw err;
  }
}

// The SDK batches everything a single request queued into one call here
// (see CroEngineClient.flush() in @cro-engine/sdk) — a consuming app's page
// render never blocks on this, and this route never blocks on more than one
// round trip regardless of how many events were queued.
export async function POST(request: Request): Promise<NextResponse> {
  const projectId = await requireApiKeyProject(request);
  if (!projectId) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: HTTP_STATUS.UNAUTHORIZED });

  const parsed = await parseJsonBody(request, eventsBatchSchema);
  if (!parsed.success) return NextResponse.json({ errors: parsed.errors }, { status: HTTP_STATUS.BAD_REQUEST });
  const variantKeysByExperiment =
    parsed.data.exposures.length > 0 ? await getVariantKeysByExperiment(projectId) : new Map<string, Set<string>>();
  const { exposures, conversions, rejected } = partitionEvents(parsed.data, variantKeysByExperiment);

  await Promise.all(exposures.map((exposure) => logExposure(projectId, exposure)));

  if (conversions.length > 0) {
    await prisma.conversion.createMany({
      data: conversions.map((conversion) => ({
        projectId,
        userId: conversion.userId,
        eventName: conversion.eventName,
        value: conversion.value ?? null,
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    accepted: { exposures: exposures.length, conversions: conversions.length },
    rejected,
  });
}
